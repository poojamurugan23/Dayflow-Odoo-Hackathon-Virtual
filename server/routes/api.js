const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// GET /api/data/employees
router.get('/employees', authMiddleware, async (req, res) => {
  try {
    const employees = await User.find().select('-password');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/data/employees (Admin only)
router.post('/employees', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create employees' });
    }

    const { name, email, phone, department, position, companyName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate Login ID: OI + [First2 of FirstName + First2 of LastName] + [Year] + [Serial]
    // Example: OIJODO20220001
    const companyPrefix = 'OI'; // Always "OI" for Odoo India
    
    let nameCode = 'XXXX';
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        nameCode = (parts[0].substring(0, 2) + parts[parts.length - 1].substring(0, 2)).toUpperCase();
      } else {
        nameCode = parts[0].substring(0, 4).toUpperCase();
      }
    }
    
    const joiningYear = new Date().getFullYear();
    
    const startOfYear = new Date(joiningYear, 0, 1);
    const endOfYear = new Date(joiningYear + 1, 0, 1);
    const countThisYear = await User.countDocuments({ 
      created_at: { $gte: startOfYear, $lt: endOfYear } 
    });
    const serial = (countThisYear + 1).toString().padStart(4, '0');
    
    const login_id = `${companyPrefix}${nameCode}${joiningYear}${serial}`;

    // Auto-generate password
    const rawPassword = `Dayflow@${joiningYear}`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const user = new User({
      email,
      password: hashedPassword,
      role: 'employee',
      name,
      company_name: companyName || 'Odoo India',
      phone,
      department,
      position,
      login_id,
      joining_date: new Date()
    });

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    
    // Return the generated password so the Admin can share it with the employee
    res.status(201).json({ user: userObj, generatedPassword: rawPassword });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/data/attendance (Employee: own records, Admin: all records for a date)
router.get('/attendance', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      // Admin: get all attendance for a specific date
      const dateParam = req.query.date; // e.g. "2026-08-22"
      let dateFilter = {};
      if (dateParam) {
        const d = new Date(dateParam);
        d.setHours(0, 0, 0, 0);
        const nextDay = new Date(d);
        nextDay.setDate(nextDay.getDate() + 1);
        dateFilter = { date: { $gte: d, $lt: nextDay } };
      }
      const attendance = await Attendance.find(dateFilter)
        .sort({ date: -1 })
        .populate('employee_id', 'name login_id department position');
      res.json(attendance);
    } else {
      // Employee: own records, optionally filtered by month
      const monthParam = req.query.month; // e.g. "2026-08"
      let filter = { employee_id: req.user.id };
      if (monthParam) {
        const [year, month] = monthParam.split('-').map(Number);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 1);
        filter.date = { $gte: start, $lt: end };
      }
      const attendance = await Attendance.find(filter).sort({ date: -1 });
      res.json(attendance);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/data/attendance/check-in
router.post('/attendance/check-in', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let record = await Attendance.findOne({ employee_id: req.user.id, date: today });
    if (record && record.check_in) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    if (!record) {
      record = new Attendance({ employee_id: req.user.id, date: today });
    }
    
    record.check_in = new Date();
    await record.save();

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/data/attendance/check-out
router.post('/attendance/check-out', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let record = await Attendance.findOne({ employee_id: req.user.id, date: today });
    if (!record || !record.check_in) {
      return res.status(400).json({ message: 'Must check in first' });
    }
    if (record.check_out) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    record.check_out = new Date();
    await record.save();

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const Payroll = require('../models/Payroll');
const Notification = require('../models/Notification');

// GET /api/data/timeoff (Employee: own leaves, Admin: all leave requests)
router.get('/timeoff', authMiddleware, async (req, res) => {
  try {
    let leaves;
    if (req.user.role === 'admin') {
      leaves = await LeaveRequest.find()
        .sort({ createdAt: -1 })
        .populate('employee_id', 'name login_id department position');
    } else {
      leaves = await LeaveRequest.find({ employee_id: req.user.id }).sort({ createdAt: -1 });
    }
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/data/timeoff (Apply for leave — employee for self, admin on behalf of employee)
router.post('/timeoff', authMiddleware, async (req, res) => {
  try {
    const { type, startDate, endDate, reason, employeeId } = req.body;

    // Admin can post on behalf of any employee; otherwise use logged-in user
    const targetEmployeeId = (req.user.role === 'admin' && employeeId) ? employeeId : req.user.id;

    const leave = new LeaveRequest({
      employee_id: targetEmployeeId,
      type,
      start_date: startDate,
      end_date: endDate,
      reason: reason || `${type} Request`
    });

    await leave.save();

    // Populate employee info for admin view
    await leave.populate('employee_id', 'name login_id department position');
    res.status(201).json(leave);
  } catch (error) {
    console.error('Create leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// PATCH /api/data/timeoff/:id/status (Admin Approve/Reject leave)
router.patch('/timeoff/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can review leaves' });
    }

    const { status, review_comment } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leave.status = status;
    if (review_comment) leave.review_comment = review_comment;
    await leave.save();

    // Create a notification for the employee
    await Notification.create({
      employee_id: leave.employee_id,
      title: `Leave Request ${status}`,
      message: `Your ${leave.type} request was ${status.toLowerCase()}.${review_comment ? ` Note: ${review_comment}` : ''}`,
      type: status === 'Approved' ? 'success' : 'warning',
      is_read: false
    });

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/data/timeoff/:id (Admin remove time off)
router.delete('/timeoff/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can remove time off records' });
    }

    const leave = await LeaveRequest.findByIdAndDelete(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    res.json({ message: 'Time off record removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/data/payroll (Employee: own payslips, Admin: all records)
router.get('/payroll', authMiddleware, async (req, res) => {
  try {
    let payrolls;
    if (req.user.role === 'admin') {
      payrolls = await Payroll.find()
        .sort({ createdAt: -1 })
        .populate('employee_id', 'name login_id department position');
    } else {
      payrolls = await Payroll.find({ employee_id: req.user.id }).sort({ createdAt: -1 });
    }
    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/data/payroll (Admin: create payroll record)
router.post('/payroll', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create payroll' });
    }

    const { employee_id, basic, hra, allowances, bonus, pf, professional_tax, other_deductions, pay_period, payment_date } = req.body;

    const payroll = new Payroll({
      employee_id,
      basic: Number(basic) || 0,
      hra: Number(hra) || 0,
      allowances: Number(allowances) || 0,
      bonus: Number(bonus) || 0,
      pf: Number(pf) || 0,
      professional_tax: Number(professional_tax) || 0,
      other_deductions: Number(other_deductions) || 0,
      pay_period,
      payment_date: payment_date ? new Date(payment_date) : new Date()
    });

    await payroll.save();
    res.status(201).json(payroll);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/data/reports (Admin summary metrics)
router.get('/reports', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalEmployees = await User.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const presentToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'Present'
    });

    const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending' });
    const approvedLeaves = await LeaveRequest.countDocuments({ status: 'Approved' });

    const payrollTotal = await Payroll.aggregate([
      { $group: { _id: null, total: { $sum: '$basic' } } }
    ]);

    res.json({
      totalEmployees,
      presentToday,
      pendingLeaves,
      approvedLeaves,
      totalBasicPayroll: payrollTotal[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
