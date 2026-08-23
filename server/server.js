const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(compression()); // Add compression for faster response sizes
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dayflow';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('Make sure you have added your MONGO_URI to the server/.env file.');
  });

// Routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
app.use('/api/auth', authRoutes);
app.use('/api/data', apiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DayFlow Backend is running!' });
});

// Trigger setup endpoint (to create Super Admin on fresh deployment)
app.get('/api/setup-superadmin', (req, res) => {
  const { exec } = require('child_process');
  exec('node setup_superadmin.js', { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(`Error setting up super admin: ${error.message}`);
    }
    res.send(`Super Admin created successfully! <br><pre>${stdout}</pre><br><strong>Login ID: OISUAD20240001</strong><br><strong>Password: SuperAdmin@123</strong>`);
  });
});



// Bulk import endpoint (temporary for hackathon migration)
app.post('/api/import-all', async (req, res) => {
  try {
    const User = require('./models/User');
    const Attendance = require('./models/Attendance');
    const LeaveRequest = require('./models/LeaveRequest');
    const Payroll = require('./models/Payroll');
    const Notification = require('./models/Notification');

    const { users, attendance, leaves, payrolls, notifications, clearFirst } = req.body;

    if (clearFirst) {
      await User.deleteMany({});
      await Attendance.deleteMany({});
      await LeaveRequest.deleteMany({});
      await Payroll.deleteMany({});
      await Notification.deleteMany({});
      console.log('Cleared all existing data.');
    }

    let counts = { users: 0, attendance: 0, leaves: 0, payrolls: 0, notifications: 0 };

    if (users && users.length) {
      await User.insertMany(users, { ordered: false }).catch(() => {});
      counts.users = users.length;
    }
    if (attendance && attendance.length) {
      await Attendance.insertMany(attendance, { ordered: false }).catch(() => {});
      counts.attendance = attendance.length;
    }
    if (leaves && leaves.length) {
      await LeaveRequest.insertMany(leaves, { ordered: false }).catch(() => {});
      counts.leaves = leaves.length;
    }
    if (payrolls && payrolls.length) {
      await Payroll.insertMany(payrolls, { ordered: false }).catch(() => {});
      counts.payrolls = payrolls.length;
    }
    if (notifications && notifications.length) {
      await Notification.insertMany(notifications, { ordered: false }).catch(() => {});
      counts.notifications = notifications.length;
    }

    res.json({ message: 'Import successful!', counts });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../dist')));

// Anything that doesn't match the API routes should send back the index.html file
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
