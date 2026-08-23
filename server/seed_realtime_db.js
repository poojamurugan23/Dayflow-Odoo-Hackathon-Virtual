const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Attendance = require('./models/Attendance');
const LeaveRequest = require('./models/LeaveRequest');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://2309poojamurugan_db_user:Pooja2006%40@cluster0.xsl37fp.mongodb.net/dayflow?appName=Cluster0';

const EMPLOYEES = [
  { name: 'Michael Chen', email: 'michael.c@odoo.com', gender: 'male', department: 'Engineering', position: 'Frontend Developer' },
  { name: 'Sarah Jenkins', email: 'sarah.j@odoo.com', gender: 'female', department: 'Engineering', position: 'Backend Developer' },
  { name: 'David Smith', email: 'david.s@odoo.com', gender: 'male', department: 'Product', position: 'Product Manager' },
  { name: 'Emily Davis', email: 'emily.d@odoo.com', gender: 'female', department: 'Marketing', position: 'Marketing Lead' },
  { name: 'James Wilson', email: 'james.w@odoo.com', gender: 'male', department: 'Finance', position: 'Financial Analyst' },
  { name: 'Sophia Lee', email: 'sophia.l@odoo.com', gender: 'female', department: 'Operations', position: 'Operations Manager' },
  { name: 'Daniel Martinez', email: 'daniel.m@odoo.com', gender: 'male', department: 'Engineering', position: 'DevOps Engineer' },
  { name: 'Olivia Taylor', email: 'olivia.t@odoo.com', gender: 'female', department: 'HR', position: 'Recruiter' },
  { name: 'William Brown', email: 'william.b@odoo.com', gender: 'male', department: 'Sales', position: 'Sales Representative' },
  { name: 'Emma Anderson', email: 'emma.a@odoo.com', gender: 'female', department: 'Engineering', position: 'QA Engineer' },
  { name: 'Alexander Thomas', email: 'alexander.t@odoo.com', gender: 'male', department: 'Product', position: 'UX Designer' },
  { name: 'Isabella Jackson', email: 'isabella.j@odoo.com', gender: 'female', department: 'Marketing', position: 'Content Creator' }
];

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // 1. Create employees if they don't exist
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);

    console.log('Checking existing employees...');
    let employeeDocs = await User.find({ role: 'employee' });

    if (employeeDocs.length < 12) {
      console.log('Seeding employees...');
      for (const emp of EMPLOYEES) {
        const exists = await User.findOne({ email: emp.email });
        if (!exists) {
          const newUser = new User({
            name: emp.name,
            email: emp.email,
            password: defaultPassword,
            role: 'employee',
            gender: emp.gender,
            department: emp.department,
            position: emp.position,
            company_name: 'Odoo India',
            login_id: `OI${emp.name.substring(0,2).toUpperCase()}${new Date().getFullYear()}00${Math.floor(Math.random() * 100)}`,
            status: 'Active',
            joining_date: new Date(new Date().setMonth(new Date().getMonth() - Math.floor(Math.random() * 12)))
          });
          await newUser.save();
        }
      }
      employeeDocs = await User.find({ role: 'employee' });
    }

    console.log(`Found ${employeeDocs.length} employees.`);

    // 2. Clear old attendance
    console.log('Clearing old attendance records...');
    await Attendance.deleteMany({});

    // 3. Generate realistic attendance for the last 5 days
    console.log('Generating realistic attendance for the past 5 days...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 4; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      // Skip weekends (0 is Sunday, 6 is Saturday)
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      for (const emp of employeeDocs) {
        // 90% chance to be present
        if (Math.random() < 0.9) {
          const checkInTime = new Date(d);
          // Random check in between 8:30 AM and 9:30 AM
          checkInTime.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);
          
          const checkOutTime = new Date(d);
          // Random check out between 5:00 PM and 6:30 PM
          checkOutTime.setHours(17 + (Math.random() > 0.5 ? 1 : 0), Math.floor(Math.random() * 60), 0);

          const record = new Attendance({
            employee_id: emp._id,
            date: d,
            check_in: checkInTime,
            check_out: i === 0 ? null : checkOutTime, // Don't checkout for today yet!
            status: 'Present'
          });
          await record.save();
        }
      }
    }

    // 4. Leave Requests
    console.log('Clearing old leaves...');
    await LeaveRequest.deleteMany({});

    if (employeeDocs.length > 2) {
      console.log('Adding sample leave requests...');
      const l1 = new LeaveRequest({
        employee_id: employeeDocs[0]._id,
        leave_type: 'Sick Leave',
        start_date: today,
        end_date: new Date(today.getTime() + 86400000 * 2),
        reason: 'Viral fever',
        status: 'Approved'
      });
      await l1.save();

      const l2 = new LeaveRequest({
        employee_id: employeeDocs[1]._id,
        leave_type: 'Paid time off',
        start_date: new Date(today.getTime() + 86400000 * 5),
        end_date: new Date(today.getTime() + 86400000 * 8),
        reason: 'Family vacation',
        status: 'Pending'
      });
      await l2.save();
    }

    console.log('✅ Real-time Database Seeding Complete!');
    process.exit(0);

  } catch (err) {
    console.error('Error seeding DB:', err);
    process.exit(1);
  }
}

seedData();
