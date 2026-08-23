const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Trigger Seed endpoint (temporary for hackathon deployment)
app.get('/api/trigger-seed', (req, res) => {
  const { exec } = require('child_process');
  exec('node seed.js', { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(`Error running seed: ${error.message}`);
    }
    res.send(`Seed script executed successfully! <br><pre>${stdout}</pre>`);
  });
});



// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
