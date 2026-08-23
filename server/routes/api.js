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

const nodemailer = require('nodemailer');

// POST /api/data/employees (Admin only)
router.post('/employees', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create employees' });
    }

    const { name, email, phone, department, position, companyName, joiningDate, monthWage, workingDays, breakTime } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const actualCompanyName = companyName || 'Odoo India';
    const actualJoiningDate = joiningDate ? new Date(joiningDate) : new Date();

    // 1. Company Initials (e.g., Odoo India -> OI)
    const compWords = actualCompanyName.trim().split(/\s+/);
    let compCode = "OI";
    if (compWords.length >= 2) {
      compCode = (compWords[0].charAt(0) + compWords[1].charAt(0)).toUpperCase();
    } else if (compWords.length === 1) {
      compCode = compWords[0].substring(0, 2).toUpperCase();
    }
    
    // 2. First two letters of first name and last name (e.g., John Doe -> JODO)
    const nameParts = name.trim().split(/\s+/);
    let nameCode = "";
    if (nameParts.length >= 2) {
      const firstPart = nameParts[0].substring(0, 2).toUpperCase().padEnd(2, 'X');
      const lastPart = nameParts[nameParts.length - 1].substring(0, 2).toUpperCase().padEnd(2, 'X');
      nameCode = `${firstPart}${lastPart}`;
    } else if (nameParts.length === 1) {
      nameCode = nameParts[0].substring(0, 4).toUpperCase().padEnd(4, 'X');
    }
    
    // 3. Year of joining
    const yyyy = actualJoiningDate.getFullYear();
    const dateCode = `${yyyy}`;
    
    // 4. Serial number of joining for that year
    const startOfYear = new Date(yyyy, 0, 1);
    const endOfYear = new Date(yyyy + 1, 0, 1);
    const countThisYear = await User.countDocuments({ 
      joining_date: { $gte: startOfYear, $lt: endOfYear } 
    });
    const serial = (countThisYear + 1).toString().padStart(4, '0');
    
    // Final Login ID: e.g. OIJODO20220001
    const login_id = `${compCode}${nameCode}${dateCode}${serial}`;

    // Auto-generate a completely unique password (e.g. 8 random alphanumeric characters)
    const crypto = require('crypto');
    const rawPassword = crypto.randomBytes(4).toString('hex'); // 8 characters
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const user = new User({
      email,
      password: hashedPassword,
      role: 'employee',
      name,
      company_name: actualCompanyName,
      phone,
      department,
      position,
      login_id,
      joining_date: actualJoiningDate,
      month_wage: Number(monthWage) || 50000,
      working_days: Number(workingDays) || 5,
      break_time: Number(breakTime) || 1
    });

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    
    // --- Send Welcome Email via Nodemailer ---
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'odooindiahawkinshackerzzz@gmail.com',
          pass: process.env.EMAIL_PASSWORD || 'missing_password'
        }
      });

      const mailOptions = {
        from: '"Odoo-HRMS Team" <odooindiahawkinshackerzzz@gmail.com>',
        to: email,
        subject: 'Welcome to Odoo-HRMS - Your Login Credentials',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Welcome to Odoo-HRMS</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F3F4F6; margin: 0; padding: 40px 0;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #502D55 0%, #935073 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">Odoo-HRMS</h1>
                  <p style="color: #fce7f3; margin: 10px 0 0 0; font-size: 16px;">Welcome aboard, ${name}!</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 0;">
                    We are thrilled to have you join our team. Your employee profile has been successfully set up on the <strong>Odoo-HRMS</strong> platform. 
                  </p>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Below are your secure login credentials to access your dashboard, view your payroll, and manage your attendance.
                  </p>
                  
                  <!-- Credentials Box -->
                  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
                    <div style="margin-bottom: 15px;">
                      <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; display: block; margin-bottom: 5px;">Login ID</span>
                      <strong style="font-size: 20px; color: #111827; font-family: monospace;">${login_id}</strong>
                    </div>
                    <div>
                      <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; display: block; margin-bottom: 5px;">Temporary Password</span>
                      <strong style="font-size: 20px; color: #111827; font-family: monospace; background: #fee2e2; padding: 4px 12px; border-radius: 6px; color: #991b1b;">${rawPassword}</strong>
                    </div>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 0; border-left: 4px solid #502D55; padding-left: 15px; background: #fdf8fa; padding: 10px 15px;">
                    <strong>Security Notice:</strong> Please log in using these credentials immediately. We strongly recommend changing your password after your first login to ensure the security of your account.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #f3f4f6;">
                  <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                    This is an automated message from Odoo-HRMS. Please do not reply directly to this email.
                  </p>
                  <p style="color: #9ca3af; font-size: 13px; margin: 5px 0 0 0;">
                    &copy; ${new Date().getFullYear()} Odoo India. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      if (process.env.EMAIL_PASSWORD) {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${email}`);
      } else {
        console.warn('EMAIL_PASSWORD not set in .env; skipping email sending.');
      }
    } catch (mailError) {
      console.error('Failed to send welcome email:', mailError);
    }
    
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

// GET /api/data/notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ employee_id: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/data/notifications/:id/read
router.patch('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, employee_id: req.user.id },
      { is_read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/data/profile (Update Resume and Private Info)
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { 
      employeeId, 
      about, job_love, hobbies, skills, certifications,
      address, bank_name, account_number, ifsc_code, emergency_contact_name, emergency_contact_phone, dob, nationality, gender, marital_status,
      month_wage, working_days, break_time
    } = req.body;

    // Admin can update anyone's profile if they pass employeeId, otherwise users update their own
    const targetUserId = (req.user.role === 'admin' && employeeId) ? employeeId : req.user.id;

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only update fields that are provided
    if (about !== undefined) user.about = about;
    if (job_love !== undefined) user.job_love = job_love;
    if (hobbies !== undefined) user.hobbies = hobbies;
    if (skills !== undefined) user.skills = skills;
    if (certifications !== undefined) user.certifications = certifications;

    if (address !== undefined) user.address = address;
    if (bank_name !== undefined) user.bank_name = bank_name;
    if (account_number !== undefined) user.account_number = account_number;
    if (ifsc_code !== undefined) user.ifsc_code = ifsc_code;
    if (emergency_contact_name !== undefined) user.emergency_contact_name = emergency_contact_name;
    if (emergency_contact_phone !== undefined) user.emergency_contact_phone = emergency_contact_phone;
    if (dob !== undefined) user.dob = dob ? new Date(dob) : null;
    if (nationality !== undefined) user.nationality = nationality;
    if (gender !== undefined) user.gender = gender;
    if (marital_status !== undefined) user.marital_status = marital_status;

    // Admin only updates for salary
    if (req.user.role === 'admin') {
      if (month_wage !== undefined) user.month_wage = Number(month_wage);
      if (working_days !== undefined) user.working_days = Number(working_days);
      if (break_time !== undefined) user.break_time = Number(break_time);
    }

    await user.save();
    
    // Don't send password back
    const userObj = user.toObject();
    delete userObj.password;

    res.json(userObj);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
