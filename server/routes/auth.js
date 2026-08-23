const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

    // 1. Company prefix is always "OI" (Odoo India)
    const companyPrefix = 'OI';
    
    // 2. Name code: first 2 letters of first name + first 2 letters of last name
    let nameCode = 'XXXX';
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        nameCode = (parts[0].substring(0, 2) + parts[parts.length - 1].substring(0, 2)).toUpperCase();
      } else {
        nameCode = parts[0].substring(0, 4).toUpperCase();
      }
    }
    
    // 3. Year of joining (current year for new signups)
    const joiningYear = new Date().getFullYear();
    
    // 4. Serial number: count how many users joined this year and increment
    const startOfYear = new Date(joiningYear, 0, 1);
    const endOfYear = new Date(joiningYear + 1, 0, 1);
    const countThisYear = await User.countDocuments({ 
      createdAt: { $gte: startOfYear, $lt: endOfYear } 
    });
    const serial = (countThisYear + 1).toString().padStart(4, '0');
    
    const login_id = `${companyPrefix}${nameCode}${joiningYear}${serial}`;

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
