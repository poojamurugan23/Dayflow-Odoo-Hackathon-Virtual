const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dayflow').then(async () => {
  await User.updateMany({ role: 'hr', position: 'New Employee' }, { $set: { position: 'HR Manager', department: 'Human Resources' } });
  console.log('Updated existing HRs');
  process.exit(0);
});
