const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Attendance = require('./models/Attendance');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dayflow';

mongoose.connect(MONGO_URI).then(async () => {
  console.log('MongoDB Connected');

  const employees = await User.find({ role: 'employee' });
  console.log(`Found ${employees.length} employees to seed attendance for.`);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentDay = now.getDate(); // Up to today

  let recordsCreated = 0;

  for (const emp of employees) {
    // Delete any existing attendance for this user for the current month just to be clean
    const startOfMonth = new Date(year, month, 1);
    await Attendance.deleteMany({ employee_id: emp._id, date: { $gte: startOfMonth } });

    // Seed from 1st of the month up to *today* (inclusive)
    for (let day = 1; day <= currentDay; day++) {
      const date = new Date(year, month, day);
      
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }

      // 90% chance they were present
      if (Math.random() < 0.9) {
        const checkInHour = 8 + Math.random(); // 8:00 AM to 9:00 AM
        const checkInDate = new Date(date);
        checkInDate.setHours(Math.floor(checkInHour), Math.floor((checkInHour % 1) * 60), 0);

        const checkOutHour = 17 + Math.random() * 2; // 5:00 PM to 7:00 PM
        const checkOutDate = new Date(date);
        checkOutDate.setHours(Math.floor(checkOutHour), Math.floor((checkOutHour % 1) * 60), 0);

        await Attendance.create({
          employee_id: emp._id,
          date: date,
          check_in: checkInDate,
          check_out: checkOutDate,
          status: 'Present'
        });
        recordsCreated++;
      }
    }
  }

  console.log(`Successfully created ${recordsCreated} realistic past attendance records.`);
  process.exit();

}).catch(err => {
  console.error(err);
  process.exit(1);
});
