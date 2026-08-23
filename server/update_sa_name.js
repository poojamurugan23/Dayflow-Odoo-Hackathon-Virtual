const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dayflow';

async function updateSuperAdminName() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const result = await User.findOneAndUpdate(
      { role: 'admin' },
      { name: 'Vikram Patel' },
      { new: true }
    );

    if (result) {
      console.log('Super Admin name updated to:', result.name);
    } else {
      console.log('Super Admin not found.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

updateSuperAdminName();
