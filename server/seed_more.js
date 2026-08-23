const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dayflow';

async function seedMore() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding extra users...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Demo@123', salt);

    const newEmployees = [
      {
        login_id: 'OIARCH20260001',
        email: 'Archu1702@gmail.com',
        password: passwordHash,
        role: 'employee',
        name: 'Archana',
        company_name: 'Odoo India',
        phone: '+91 99887 11111',
        department: 'Unassigned',
        position: 'New Employee',
        joining_date: new Date('2026-08-22')
      },
      {
        login_id: 'OIKRK20260001',
        email: 'krithikaarajkumaar@gmail.com',
        password: passwordHash,
        role: 'employee',
        name: 'Krithikaa K',
        company_name: 'Odoo India',
        phone: '+91 99887 22222',
        department: 'Engineering',
        position: 'Senior Development',
        joining_date: new Date('2026-08-22')
      },
      {
        login_id: 'OIPAVI20260001',
        email: 'pavi23125@gmail.com',
        password: passwordHash,
        role: 'employee',
        name: 'Pavithra',
        company_name: 'Odoo India',
        phone: '+91 99887 33333',
        department: 'Unassigned',
        position: 'New Employee',
        joining_date: new Date('2026-08-22')
      }
    ];

    for (let empData of newEmployees) {
      const exists = await User.findOne({ email: empData.email });
      if (!exists) {
        await User.create(empData);
        console.log(`Created ${empData.name}`);
      } else {
        console.log(`${empData.name} already exists.`);
      }
    }

    console.log('✅ Extra mock users seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedMore();
