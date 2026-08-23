
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/dayflow').then(async () => {
  require('./models/User');
  const Attendance = require('./models/Attendance');
  const d = new Date('2026-08-27T00:00:00Z');
  const nextDay = new Date('2026-08-28T00:00:00Z');
  const att = await Attendance.find({ date: { $gte: d, $lt: nextDay } }).populate('employee_id');
  console.log('Count:', att.length);
  if(att.length > 0) console.log(JSON.stringify(att, null, 2));
  process.exit(0);
});

