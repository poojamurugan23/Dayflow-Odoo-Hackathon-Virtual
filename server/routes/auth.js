const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, role, name, companyName, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate login ID: OI + [First2 of FirstName + First2 of LastName] + [Year of Joining] + [Serial]
    // Example: OIJODO20220001
    // OI = Odoo India (always fixed)
    // JODO = JO(hn) + DO(e) = first 2 letters of first name + first 2 letters of last name
    // 2022 = Year of Joining
    // 0001 = Serial Number of Joining for that Year

    // 1. Company Initials (e.g., Odoo India -> OI)
    const actualCompanyName = companyName || 'Odoo India';
    const compWords = actualCompanyName.trim().split(/\s+/);
    let compCode = "OI";
    if (compWords.length >= 2) {
      compCode = (compWords[0].charAt(0) + compWords[1].charAt(0)).toUpperCase();
    } else if (compWords.length === 1) {
      compCode = compWords[0].substring(0, 2).toUpperCase();
    }
    
    // 2. Name code: first 2 letters of first name + first 2 letters of last name
    let nameCode = 'XXXX';
    if (name) {
      const nameParts = name.trim().split(/\s+/);
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
    
    // 4. Serial number: count how many users joined this year and increment
    const startOfYear = new Date(joiningYear, 0, 1);
    const endOfYear = new Date(joiningYear + 1, 0, 1);
    const countThisYear = await User.countDocuments({ 
      joining_date: { $gte: startOfYear, $lt: endOfYear } 
    });
    const serial = (countThisYear + 1).toString().padStart(4, '0');
    
    const login_id = `${compCode}${nameCode}${joiningYear}${serial}`;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      role: role || 'employee',
      name,
      company_name: companyName,
      phone,
      login_id
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ token, user: userObj });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
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
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
