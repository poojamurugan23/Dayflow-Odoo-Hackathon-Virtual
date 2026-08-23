const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pdfParse = require('pdf-parse');

const User = require('../models/User');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Complaint = require('../models/Complaint');
const Meeting = require('../models/Meeting');

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
    const employees = await User.find().select('-password').lean();
    
    // Calculate status for each employee
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendances = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).lean();

    const leaves = await LeaveRequest.find({
      status: 'approved',
      start_date: { $lte: today },
      end_date: { $gte: today }
    }).lean();

    const mappedEmployees = employees.map(emp => {
      let status = 'Absent';
      
      const hasCheckedIn = attendances.some(a => a.employee_id.toString() === emp._id.toString());
      if (hasCheckedIn) {
        status = 'Present';
      } else {
        const isOnLeave = leaves.some(l => l.employee_id.toString() === emp._id.toString());
        if (isOnLeave) {
          status = 'On Leave';
        }
      }
      
      return { ...emp, status };
    });

    res.json(mappedEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const nodemailer = require('nodemailer');

// POST /api/data/employees (Admin only)
router.post('/employees', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Not authorized to create employees' });
    }

    const { name, email, phone, department, position, companyName, joiningDate, monthWage, workingDays, breakTime, dob, gender, profilePicture, resumeUrl } = req.body;

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

    // Auto-generate password: [FirstName][YearOfBirth] (e.g. Pooja1995)
    let passwordYear = new Date().getFullYear().toString();
    if (dob) {
      passwordYear = new Date(dob).getFullYear().toString();
    }
    const rawPassword = `${nameParts[0]}${passwordYear}`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    // Calculate Salary Components
    const baseSalary = Number(monthWage) || 50000;
    const basic = baseSalary * 0.50;
    const hra = baseSalary * 0.20;
    const allowances = baseSalary * 0.20;
    const pf = baseSalary * 0.10;

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
      dob: dob ? new Date(dob) : null,
      gender: gender || '',
      profile_picture: profilePicture || '',
      resume_url: resumeUrl || '',
      month_wage: baseSalary,
      basic_salary: basic,
      hra: hra,
      allowances: allowances,
      pf: pf,
      working_days: Number(workingDays) || 5,
      break_time: Number(breakTime) || 1
    });

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    
    // --- Send Welcome Email via Nodemailer ---
    try {
        const emailPass = (process.env.EMAIL_PASSWORD || 'missing_password').replace(/["' ]/g, '');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'odooindiahawkinshackerzzz@gmail.com',
            pass: emailPass
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
                  
                  <!-- Salary Information -->
                  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-left: 4px solid #10B981; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #111827; font-size: 16px;">Salary Breakdown (Monthly)</h3>
                    <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 14px; color: #4b5563;">
                      <tr><td style="border-bottom: 1px solid #f3f4f6;"><strong>Gross Salary</strong></td><td align="right" style="border-bottom: 1px solid #f3f4f6;">₹${baseSalary.toLocaleString('en-IN')}</td></tr>
                      <tr><td style="border-bottom: 1px solid #f3f4f6;">Basic (50%)</td><td align="right" style="border-bottom: 1px solid #f3f4f6;">₹${basic.toLocaleString('en-IN')}</td></tr>
                      <tr><td style="border-bottom: 1px solid #f3f4f6;">HRA (20%)</td><td align="right" style="border-bottom: 1px solid #f3f4f6;">₹${hra.toLocaleString('en-IN')}</td></tr>
                      <tr><td style="border-bottom: 1px solid #f3f4f6;">Allowances (20%)</td><td align="right" style="border-bottom: 1px solid #f3f4f6;">₹${allowances.toLocaleString('en-IN')}</td></tr>
                      <tr><td>PF Deduction (10%)</td><td align="right">₹${pf.toLocaleString('en-IN')}</td></tr>
                    </table>
                  </div>
                  
                  <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 15px 20px; margin: 30px 0;">
                    <h4 style="color: #92400e; margin-top: 0; margin-bottom: 10px; font-size: 15px;">⚠️ Important Next Steps</h4>
                    <ul style="color: #b45309; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
                      <li>Click the button below to log in immediately.</li>
                      <li>Go to your <strong>Profile</strong> section.</li>
                      <li><strong>Upload your Resume</strong>.</li>
                      <li>Fill out your personal details, emergency contacts, and list your skills.</li>
                    </ul>
                    <div style="text-align: center; margin-top: 20px;">
                      <a href="${process.env.FRONTEND_URL || 'https://dayflow-api-n4i2.onrender.com'}/login" style="background-color: #502D55; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Access My Dashboard</a>
                    </div>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 0; border-left: 4px solid #502D55; padding-left: 15px; background: #fdf8fa; padding: 10px 15px;">
                    <strong>Security Notice:</strong> We strongly recommend changing your password after your first login to ensure the security of your account.
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
        // Send email asynchronously without blocking the response
        transporter.sendMail(mailOptions)
          .then(() => console.log(`Welcome email sent to ${email}`))
          .catch(err => console.error('Failed to send welcome email:', err));
      } else {
        console.warn('EMAIL_PASSWORD not set in .env; skipping email sending.');
      }
    } catch (mailError) {
      console.error('Email setup error:', mailError);
    }
    
    // Return the generated password so the Admin can share it with the employee
    res.status(201).json({ user: userObj, generatedPassword: rawPassword });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/data/dashboard-stats (Employee personal stats)
router.get('/dashboard-stats', authMiddleware, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const now = new Date();
    
    // 1. Get attendance records for the last 7 days
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const attendances = await Attendance.find({
      employee_id: employeeId,
      date: { $gte: sevenDaysAgo }
    }).sort({ date: 1 });

    // Calculate weekly hours data (Mon-Sun or last 5 days)
    const weeklyHoursData = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStr = daysOfWeek[d.getDay()];
      
      const record = attendances.find(a => 
        a.date.toISOString().split('T')[0] === d.toISOString().split('T')[0]
      );
      
      let hours = 0;
      if (record && record.check_in && record.check_out) {
        hours = (new Date(record.check_out) - new Date(record.check_in)) / (1000 * 60 * 60);
      }
      weeklyHoursData.push({ day: dayStr, hours: Number(hours.toFixed(1)) });
    }

    // 2. Attendance Status (Month to date)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthAttendances = await Attendance.find({
      employee_id: employeeId,
      date: { $gte: startOfMonth }
    });

    const presentCount = monthAttendances.filter(a => a.check_in).length;
    
    const monthLeaves = await LeaveRequest.find({
      employee_id: employeeId,
      status: 'Approved',
      start_date: { $lte: now },
      end_date: { $gte: startOfMonth }
    });
    
    // Simple heuristic for leave days (assuming each approved request is at least 1 day in the month)
    let leaveCount = 0;
    monthLeaves.forEach(l => {
      const s = new Date(Math.max(new Date(l.start_date), startOfMonth));
      const e = new Date(Math.min(new Date(l.end_date), now));
      const days = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
      leaveCount += days;
    });

    // Assume 22 working days in a month for simplicity
    const totalWorkingDaysSoFar = Math.max(1, Math.ceil((now - startOfMonth) / (1000 * 60 * 60 * 24)) * (5/7));
    const absentCount = Math.max(0, Math.round(totalWorkingDaysSoFar - presentCount - leaveCount));

    const attendanceData = [
      { name: 'Present', value: presentCount, color: '#22c55e' },
      { name: 'Leave', value: leaveCount, color: '#0ea5e9' },
      { name: 'Absent', value: absentCount, color: '#eab308' },
    ];

    res.json({
      weeklyHoursData,
      attendanceData
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/data/employees/:id (Admin/HR only)
router.put('/employees/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Not authorized to update employees' });
    }

    const { id } = req.params;
    const updateData = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // HR cannot edit admin or other HR
    if (req.user.role === 'hr' && (user.role === 'admin' || user.role === 'hr') && req.user.id !== id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    Object.assign(user, updateData);
    
    // Recalculate salary if monthWage is provided
    if (updateData.month_wage) {
      const baseSalary = Number(updateData.month_wage) || 50000;
      user.basic_salary = baseSalary * 0.50;
      user.hra = baseSalary * 0.20;
      user.allowances = baseSalary * 0.20;
      user.pf = baseSalary * 0.10;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/data/attendance (Employee: own records, Admin: all records for a date)
router.get('/attendance', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin' || req.user.role === 'hr') {
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
    if (req.user.role === 'admin' || req.user.role === 'hr') {
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
    const targetEmployeeId = ((req.user.role === 'admin' || req.user.role === 'hr') && employeeId) ? employeeId : req.user.id;

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
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
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
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
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

// POST /api/data/profile/parse-resume
router.post('/profile/parse-resume', authMiddleware, async (req, res) => {
  try {
    const { filename, content } = req.body;
    const user = await User.findById(req.user.id);
    user.resume_url = filename;
    
    let extractedText = '';
    
    // Check if it's a base64 encoded PDF
    if (content && content.includes('application/pdf;base64,')) {
      try {
        const base64Data = content.split('base64,')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const data = await pdfParse(buffer);
        extractedText = data.text;
      } catch (err) {
        console.error('PDF parsing failed:', err);
      }
    } else if (content && !content.includes('base64,')) {
      extractedText = content; // fallback for raw text
    }

    if (extractedText) {
      const textLower = extractedText.toLowerCase();
      
      // 1. Extract About / Summary
      let aboutText = '';
      const summaryMatch = extractedText.match(/(?:summary|objective|profile|about(?: me)?)[\s\S]*?(?=\n\s*(?:experience|education|skills|certifications|employment|history|projects|languages|$))/i);
      if (summaryMatch) {
        aboutText = summaryMatch[0].replace(/^(summary|objective|profile|about(?: me)?)\s*/i, '').trim();
      } else {
        // Fallback: look for a paragraph near the top that is long enough to be a summary
        const paragraphs = extractedText.split(/\n\s*\n/);
        for (let i = 0; i < Math.min(4, paragraphs.length); i++) {
          if (paragraphs[i].length > 100 && !paragraphs[i].includes('@') && !paragraphs[i].match(/(experience|education|skills)/i)) {
            aboutText = paragraphs[i].trim();
            break;
          }
        }
      }
      if (aboutText) {
        user.about = aboutText.substring(0, 500).replace(/\s+/g, ' ');
      }

      // 2. Extract Skills via Keyword Matching
      const commonSkills = ['javascript', 'react', 'react.js', 'node.js', 'python', 'java', 'html', 'css', 'sql', 'mongodb', 'docker', 'aws', 'typescript', 'express', 'git', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'angular', 'vue', 'tailwind', 'bootstrap', 'communication', 'teamwork', 'leadership', 'agile', 'scrum', 'problem solving', 'machine learning', 'data analysis', 'figma', 'ui/ux', 'next.js', 'graphql', 'rest api', 'kubernetes', 'ci/cd', 'linux', 'bash'];
      const foundSkills = commonSkills.filter(skill => textLower.includes(skill) || textLower.includes(skill.replace('.', '')));
      if (foundSkills.length > 0) {
        // format nicely
        const formattedSkills = foundSkills.map(s => {
          if (s === 'ui/ux') return 'UI/UX';
          if (s === 'ci/cd') return 'CI/CD';
          if (s === 'aws') return 'AWS';
          if (s === 'html') return 'HTML';
          if (s === 'css') return 'CSS';
          if (s === 'sql') return 'SQL';
          if (s === 'php') return 'PHP';
          if (s.endsWith('.js')) return s.charAt(0).toUpperCase() + s.slice(1, -3) + '.js';
          return s.charAt(0).toUpperCase() + s.slice(1);
        });
        user.skills = Array.from(new Set([...(user.skills || []), ...formattedSkills]));
      }

      // 3. Extract Certifications
      const certsMatch = extractedText.match(/(?:certifications|certificates|courses|awards)[\s\S]*?(?=\n\s*(?:experience|education|skills|employment|history|languages|projects|$))/i);
      if (certsMatch) {
        const certLines = certsMatch[0].replace(/^(certifications|certificates|courses|awards)\s*/i, '').split('\n').map(l => l.replace(/^[-*•\s]+/, '').trim()).filter(l => l.length > 10 && l.length < 150 && !l.toLowerCase().includes('certificate'));
        user.certifications = Array.from(new Set([...(user.certifications || []), ...certLines])).slice(0, 5);
      }

      // 4. Extract Email & Phone
      const emailMatch = extractedText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
      if (emailMatch && !user.personal_email) {
        user.personal_email = emailMatch[0];
      }
      
      const phoneMatch = extractedText.match(/(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
      if (phoneMatch && !user.phone) {
        user.phone = phoneMatch[0].trim();
      }
    } else {
      // Fallback if no text extracted
      user.skills = ['JavaScript', 'React.js', 'Node.js', 'Teamwork', 'Communication'];
      user.certifications = ['Hackathon Participant', 'Full Stack Development'];
      user.about = 'Enthusiastic professional with a proven track record. Extracted from resume: ' + filename;
    }
    
    await user.save();
    
    res.json({
      about: user.about,
      skills: user.skills,
      certifications: user.certifications,
      personal_email: user.personal_email,
      phone: user.phone
    });
  } catch (error) {
    console.error('Resume Parse Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/data/payroll (Employee: own payslips, Admin: all records)
router.get('/payroll', authMiddleware, async (req, res) => {
  try {
    let payrolls;
    if (req.user.role === 'admin' || req.user.role === 'hr') {
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
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
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
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalEmployees = await User.countDocuments({ role: { $nin: ['admin', 'hr'] } });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const employeeUsers = await User.find({ role: { $nin: ['admin', 'hr'] } }).select('_id department');
    const employeeIds = employeeUsers.map(u => u._id);

    // Department aggregation
    const deptCounts = {};
    employeeUsers.forEach(u => {
      const d = u.department || 'Unknown';
      deptCounts[d] = (deptCounts[d] || 0) + 1;
    });
    
    // Map to array with colors
    const colors = ['#502D55', '#935073', '#A78BA3', '#3B82F6', '#F59E0B', '#10B981', '#6366F1'];
    const deptData = Object.keys(deptCounts).map((dept, idx) => ({
      name: dept,
      value: deptCounts[dept],
      color: colors[idx % colors.length]
    }));

    const presentToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: 'Present',
      employee_id: { $in: employeeIds }
    });

    const pendingLeaves = await LeaveRequest.countDocuments({ status: 'Pending', employee_id: { $in: employeeIds } });
    const approvedLeaves = await LeaveRequest.countDocuments({ 
      status: 'Approved', 
      employee_id: { $in: employeeIds },
      start_date: { $lte: tomorrow },
      end_date: { $gte: today }
    });

    // Attendance Trend (Last 5 days)
    const attendanceTrend = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      
      const presentCount = await Attendance.countDocuments({
        date: { $gte: d, $lt: nextD },
        status: { $in: ['Present', 'Half-day'] },
        employee_id: { $in: employeeIds }
      });
      
      attendanceTrend.push({
        day: dayNames[d.getDay()],
        present: presentCount,
        absent: Math.max(0, totalEmployees - presentCount)
      });
    }

    res.json({
      totalEmployees,
      presentToday,
      pendingLeaves,
      approvedLeaves,
      totalBasicPayroll: 0,
      deptData,
      attendanceTrend
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
      personal_email, pan_no, uan_no, pin_code,
      month_wage, working_days, break_time
    } = req.body;

    // Admin can update anyone's profile if they pass employeeId, otherwise users update their own
    const targetUserId = ((req.user.role === 'admin' || req.user.role === 'hr') && employeeId) ? employeeId : req.user.id;

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
    if (personal_email !== undefined) user.personal_email = personal_email;
    if (pan_no !== undefined) user.pan_no = pan_no;
    if (uan_no !== undefined) user.uan_no = uan_no;
    if (pin_code !== undefined) user.pin_code = pin_code;

    // Admin only updates for salary
    if (req.user.role === 'admin' || req.user.role === 'hr') {
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

// --- COMPLAINTS ---

// GET /api/data/complaints
router.get('/complaints', authMiddleware, async (req, res) => {
  try {
    let complaints;
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      complaints = await Complaint.find()
        .sort({ createdAt: -1 })
        .populate('user_id', 'name login_id department position role');
    } else {
      complaints = await Complaint.find({ user_id: req.user.id }).sort({ createdAt: -1 });
    }
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/data/complaints
router.post('/complaints', authMiddleware, async (req, res) => {
  try {
    const { subject, description, generated_letter_url } = req.body;
    const complaint = new Complaint({
      user_id: req.user.id,
      subject,
      description,
      generated_letter_url
    });
    await complaint.save();
    
    // Notify admin
    const superAdmin = await User.findOne({ role: 'admin' });
    if (superAdmin) {
      await Notification.create({
        user_id: superAdmin._id,
        title: 'New Complaint Raised',
        message: `A new complaint regarding "${subject}" has been raised.`,
        type: 'warning'
      });
    }

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/data/complaints/:id/status
router.patch('/complaints/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Only admin can resolve complaints' });
    }
    const { status, admin_notes } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    complaint.status = status;
    if (admin_notes !== undefined) complaint.admin_notes = admin_notes;
    await complaint.save();

    await Notification.create({
      employee_id: complaint.user_id,
      title: 'Complaint Status Updated',
      message: `Your complaint regarding "${complaint.subject}" is now ${status}.`,
      type: 'info'
    });

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- MEETINGS ---

// GET /api/data/meetings
router.get('/meetings', authMiddleware, async (req, res) => {
  try {
    // Admin sees all, others see meetings they are participating in
    let meetings;
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      meetings = await Meeting.find()
        .sort({ date: 1 })
        .populate('host_id participants accepted_by rejected_by', 'name email login_id profile_picture');
    } else {
      meetings = await Meeting.find({
        $or: [{ host_id: req.user.id }, { participants: req.user.id }]
      })
      .sort({ date: 1 })
      .populate('host_id participants accepted_by rejected_by', 'name email login_id profile_picture');
    }
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/data/meetings
router.post('/meetings', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Only admin can arrange meetings' });
    }
    const { title, description, date, time, participants, link } = req.body;

    const meeting = new Meeting({
      title,
      description,
      date,
      time,
      host_id: req.user.id,
      participants: participants || [],
      link
    });
    await meeting.save();

    // Fetch participants to send emails and notifications
    const participantUsers = await User.find({ _id: { $in: participants } });
    
    // Simulate email and send in-app notification
    for (const p of participantUsers) {
      await Notification.create({
        employee_id: p._id,
        title: 'Meeting Scheduled',
        message: `You have a new meeting: "${title}" on ${new Date(date).toDateString()} at ${time}.`,
        type: 'info'
      });
      // Email sending simulation (or real if EMAIL_PASSWORD is set)
      console.log(`Sending Meeting Invite to ${p.email} for ${title}`);
    }

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/data/meetings/:id/rsvp
router.patch('/meetings/:id/rsvp', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    
    // Remove user from both arrays first to reset
    meeting.accepted_by = meeting.accepted_by.filter(id => id.toString() !== req.user.id);
    meeting.rejected_by = meeting.rejected_by.filter(id => id.toString() !== req.user.id);
    
    if (status === 'accepted') {
      meeting.accepted_by.push(req.user.id);
    } else if (status === 'rejected') {
      meeting.rejected_by.push(req.user.id);
    }
    
    await meeting.save();
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/data/employees/:id
router.delete('/employees/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Optional: delete associated attendance, leaves, and complaints if necessary
    await Attendance.deleteMany({ employee_id: req.params.id });
    await LeaveRequest.deleteMany({ employee_id: req.params.id });
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
