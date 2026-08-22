const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Attendance = require('./models/Attendance');
const LeaveRequest = require('./models/LeaveRequest');
const Payroll = require('./models/Payroll');
const Notification = require('./models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dayflow';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await LeaveRequest.deleteMany({});
    await Payroll.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared existing data.');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Demo@123', salt);

    // Create Admin User
    const adminUser = await User.create({
      login_id: 'OIPRSH20220001',
      email: 'hr@dayflow.demo',
      password: passwordHash,
      role: 'admin',
      name: 'Priya Sharma',
      company_name: 'Odoo India',
      phone: '+91 98765 43210',
      department: 'Human Resources',
      position: 'HR Director',
      joining_date: new Date('2022-01-15')
    });

    // Create Employee User
    const employeeUser = await User.create({
      login_id: 'OIARME20230001',
      email: 'employee@dayflow.demo',
      password: passwordHash,
      role: 'employee',
      name: 'Arjun Mehta',
      company_name: 'Odoo India',
      phone: '+91 99887 76655',
      department: 'Engineering',
      position: 'Senior Software Engineer',
      joining_date: new Date('2023-03-20')
    });

    console.log('Created mock users.');

    // Create Attendance Data for Employee
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await Attendance.insertMany([
      {
        employee_id: employeeUser._id,
        date: today,
        check_in: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 12 * 60 * 1000), // 9:12 AM
        status: 'Present'
      },
      {
        employee_id: employeeUser._id,
        date: yesterday,
        check_in: new Date(yesterday.getTime() + 9 * 60 * 60 * 1000 + 5 * 60 * 1000), // 9:05 AM
        check_out: new Date(yesterday.getTime() + 18 * 60 * 60 * 1000 + 15 * 60 * 1000), // 6:15 PM
        status: 'Present'
      },
      {
        employee_id: employeeUser._id,
        date: twoDaysAgo,
        check_in: new Date(twoDaysAgo.getTime() + 9 * 60 * 60 * 1000 + 30 * 60 * 1000), // 9:30 AM
        check_out: new Date(twoDaysAgo.getTime() + 18 * 60 * 60 * 1000 + 45 * 60 * 1000), // 6:45 PM
        status: 'Present'
      }
    ]);

    // Create Leave Requests
    const futureDate1 = new Date(today);
    futureDate1.setDate(futureDate1.getDate() + 10);
    const futureDate2 = new Date(today);
    futureDate2.setDate(futureDate2.getDate() + 15);

    await LeaveRequest.insertMany([
      {
        employee_id: employeeUser._id,
        type: 'Paid Leave',
        start_date: futureDate1,
        end_date: futureDate2,
        status: 'Pending',
        reason: 'Family vacation to Shimla'
      },
      {
        employee_id: employeeUser._id,
        type: 'Sick Leave',
        start_date: twoDaysAgo,
        end_date: yesterday,
        status: 'Approved',
        reason: 'Flu and fever',
        review_comment: 'Get well soon!'
      }
    ]);

    // Create Payroll Data
    await Payroll.insertMany([
      {
        employee_id: employeeUser._id,
        basic: 75000,
        hra: 30000,
        allowances: 15000,
        bonus: 10000,
        pf: 9000,
        professional_tax: 200,
        other_deductions: 1500,
        pay_period: 'August 2026',
        payment_date: new Date('2026-08-28')
      },
      {
        employee_id: adminUser._id,
        basic: 120000,
        hra: 48000,
        allowances: 25000,
        bonus: 20000,
        pf: 14400,
        professional_tax: 200,
        other_deductions: 2500,
        pay_period: 'August 2026',
        payment_date: new Date('2026-08-28')
      }
    ]);

    // Create Notifications
    await Notification.insertMany([
      {
        employee_id: employeeUser._id,
        title: 'Leave Approved',
        message: 'Your sick leave was approved.',
        type: 'success',
        is_read: false
      },
      {
        employee_id: adminUser._id,
        title: 'New Leave Request',
        message: 'Arjun Mehta requested Paid Leave.',
        type: 'info',
        is_read: false
      }
    ]);

    console.log('✅ Mock data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedDatabase();
