const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// GET /api/auth/seed-all (Temporary endpoint for hackathon to seed all data)
router.get('/seed-all', async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Demo@123', salt);
    const employeePasswordHash = await bcrypt.hash('password123', salt);

    const usersToCreate = [
      {
        login_id: 'OIPRSH20220001', email: 'hr@dayflow.demo', password: adminPasswordHash,
        role: 'admin', name: 'Priya Sharma', company_name: 'Odoo India',
        phone: '+91 98765 43210', department: 'Human Resources', position: 'HR Director',
        joining_date: new Date('2022-01-15')
      },
      {
        login_id: 'OIARME20230001', email: 'employee@dayflow.demo', password: adminPasswordHash,
        role: 'employee', name: 'Arjun Mehta', company_name: 'Odoo India',
        phone: '+91 99887 76655', department: 'Engineering', position: 'Senior Software Engineer',
        joining_date: new Date('2023-03-20')
      },
      {
        email: 'sarah.connor@odoo.com', password: employeePasswordHash, role: 'employee',
        name: 'Sarah Connor', company_name: 'Odoo India', phone: '+91 98765 11111',
        department: 'Engineering', position: 'Senior Frontend Developer', login_id: 'OISACO20260002',
        joining_date: new Date('2026-01-15'), month_wage: 85000, working_days: 5, break_time: 1
      },
      {
        email: 'david.miller@odoo.com', password: employeePasswordHash, role: 'employee',
        name: 'David Miller', company_name: 'Odoo India', phone: '+91 98765 22222',
        department: 'Design', position: 'UX/UI Designer', login_id: 'OIDAMI20260003',
        joining_date: new Date('2026-03-10'), month_wage: 75000, working_days: 5, break_time: 1
      },
      {
        email: 'elena.rodriguez@odoo.com', password: employeePasswordHash, role: 'employee',
        name: 'Elena Rodriguez', company_name: 'Odoo India', phone: '+91 98765 33333',
        department: 'Marketing', position: 'Marketing Specialist', login_id: 'OIELRO20260004',
        joining_date: new Date('2026-05-20'), month_wage: 65000, working_days: 5, break_time: 1
      }
    ];

    let createdCount = 0;
    for (const emp of usersToCreate) {
      const existing = await User.findOne({ email: emp.email });
      if (!existing) {
        await User.create(emp);
        createdCount++;
      }
    }

    res.json({ message: `Database seeded successfully! Added ${createdCount} new profiles.`, admin_login: 'OIPRSH20220001', admin_password: 'Demo@123' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/signup (HR ONLY - Requires Super Admin Approval)
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, companyName, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with a temporary pending login ID (Final ID generated on approval)
    const pendingId = `PENDING_HR_${Date.now()}`;

    const user = new User({
      email,
      password: hashedPassword,
      role: 'hr', // Strictly HR
      name,
      company_name: companyName || 'Odoo India',
      phone,
      login_id: pendingId,
      department: 'Human Resources',
      position: 'HR Manager',
      is_approved: false,
      must_change_password: false
    });

    await user.save();

    // Create an in-app notification for Super Admin
    const Notification = require('../models/Notification');
    // We assume Admin has role 'admin'. We can fetch the first admin to assign the notification.
    const superAdmin = await User.findOne({ role: 'admin' });
    if (superAdmin) {
      await Notification.create({
        employee_id: superAdmin._id,
        title: 'New HR Registration Pending',
        message: `A new HR manager (${name}) has registered and is awaiting approval.`,
        type: 'info'
      });
    }

    res.status(201).json({ 
      message: 'Registration successful! Your account is pending Super Admin approval.',
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// POST /api/auth/approve-hr (Super Admin Only)
router.post('/approve-hr', async (req, res) => {
  try {
    // Basic auth check
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Only Super Admin can approve HRs' });
    }

    const { hrId } = req.body; // The MongoDB _id of the HR user
    const hrUser = await User.findById(hrId);

    if (!hrUser || hrUser.role !== 'hr') {
      return res.status(404).json({ message: 'HR user not found' });
    }
    if (hrUser.is_approved) {
      return res.status(400).json({ message: 'HR is already approved' });
    }

    // Generate login ID: OI + [First 2 of First Name + First 2 of Last Name] + [Year] + [Serial]
    // 1. Company Initials (e.g., Odoo India -> OI)
    const actualCompanyName = hrUser.company_name || 'Odoo India';
    const compWords = actualCompanyName.trim().split(/\s+/);
    let compCode = "OI";
    if (compWords.length >= 2) {
      compCode = (compWords[0].charAt(0) + compWords[1].charAt(0)).toUpperCase();
    } else if (compWords.length === 1) {
      compCode = compWords[0].substring(0, 2).toUpperCase();
    }
    
    // 2. Name code: first 2 letters of first name + first 2 letters of last name
    let nameCode = 'XXXX';
    if (hrUser.name) {
      const nameParts = hrUser.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        const firstPart = nameParts[0].substring(0, 2).toUpperCase().padEnd(2, 'X');
        const lastPart = nameParts[nameParts.length - 1].substring(0, 2).toUpperCase().padEnd(2, 'X');
        nameCode = `${firstPart}${lastPart}`;
      } else {
        nameCode = nameParts[0].substring(0, 4).toUpperCase().padEnd(4, 'X');
      }
    }
    
    // 3. Year of joining (current year for new signups)
    const joiningYear = new Date().getFullYear();
    
    // 4. Serial number: count how many APPROVED users joined this year and increment
    const startOfYear = new Date(joiningYear, 0, 1);
    const endOfYear = new Date(joiningYear + 1, 0, 1);
    const countThisYear = await User.countDocuments({ 
      joining_date: { $gte: startOfYear, $lt: endOfYear },
      is_approved: true // Only count approved users for serials
    });
    const serial = (countThisYear + 1).toString().padStart(4, '0');
    
    const finalLoginId = `${compCode}${nameCode}${joiningYear}${serial}`;

    hrUser.login_id = finalLoginId;
    hrUser.serial_number = countThisYear + 1;
    hrUser.is_approved = true;
    hrUser.joining_date = new Date(); // Set official joining date to approval date

    await hrUser.save();

    // --- Send HR Approval Email via Nodemailer ---
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
        to: hrUser.email,
        subject: 'Odoo-HRMS - Account Approved',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F3F4F6; margin: 0; padding: 40px 0;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden;">
              <tr>
                <td style="background: linear-gradient(135deg, #502D55 0%, #935073 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">Odoo-HRMS</h1>
                  <p style="color: #fce7f3; margin: 10px 0 0 0; font-size: 16px;">Welcome aboard, ${hrUser.name}!</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 0;">
                    Your HR profile has been successfully approved by the Super Admin.
                  </p>
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Below is your secure login ID to access your HR dashboard. Please use the password you created during sign-up.
                  </p>
                  
                  <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
                    <div style="margin-bottom: 15px;">
                      <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; display: block; margin-bottom: 5px;">Login ID</span>
                      <strong style="font-size: 24px; color: #502D55; letter-spacing: 2px;">${finalLoginId}</strong>
                    </div>
                  </div>
                  
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="https://dayflow-ivory.vercel.app/login" style="background-color: #502D55; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Sign In Now</a>
                  </div>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Failed to send HR approval email:', emailError);
    }

    res.json({ message: 'HR approved successfully', login_id: finalLoginId });
  } catch (error) {
    console.error('Approve HR error:', error);
    res.status(500).json({ message: 'Server error during approval' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or login_id

    // Find user by email or login_id
    const user = await User.findOne({
      $or: [{ email: identifier }, { login_id: identifier }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Prevent login if not approved
    if (!user.is_approved) {
      return res.status(403).json({ message: 'Account is pending Super Admin approval' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ token, user: userObj });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET /api/auth/me (Get profile using token)
router.get('/me', async (req, res) => {
  try {
    // Basic token extraction
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', async (req, res) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password and save
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.must_change_password = false; // Reset the flag
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
