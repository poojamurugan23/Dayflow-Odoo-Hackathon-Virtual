require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dayflow';

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Downgrade Priya (OIPRSH...) to HR if she exists and is admin
    const priya = await User.findOne({ email: 'hr@dayflow.demo' });
    if (priya) {
      priya.role = 'hr';
      await priya.save();
      console.log('Downgraded Priya to HR');
    } else {
      console.log('Priya not found, skipping downgrade');
    }

    // Check if Super Admin exists
    const existingSuper = await User.findOne({ login_id: 'OISUAD20240001' });
    if (existingSuper) {
      console.log('Super Admin already exists');
    } else {
      const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);
      const superAdmin = new User({
        login_id: 'OISUAD20240001',
        email: 'superadmin@dayflow.in',
        password: hashedPassword,
        role: 'admin',
        name: 'Super Admin',
        company_name: 'DayFlow HQ',
        phone: '9999999999',
        department: 'Management',
        position: 'CEO',
        is_approved: true,
        gender: 'male',
        serial_number: 1,
      });
      await superAdmin.save();
      console.log('Created new Super Admin: OISUAD20240001');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
