const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const LeaveRequest = require('./models/LeaveRequest');
const Payroll = require('./models/Payroll');
const Notification = require('./models/Notification');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/dayflow';
const DEPLOYMENT_URL = 'https://dayflow-api-n4i2.onrender.com/api/import-all';

async function syncToCloud() {
  try {
    console.log('Connecting to Local Database...');
    await mongoose.connect(LOCAL_URI);

    console.log('Fetching local data...');
    const users = await User.find().lean();
    const attendance = await Attendance.find().lean();
    const leaves = await LeaveRequest.find().lean();
    const payrolls = await Payroll.find().lean();
    const notifications = await Notification.find().lean();

    console.log(`Found: \n- ${users.length} Users\n- ${attendance.length} Attendances\n- ${leaves.length} Leaves\n- ${payrolls.length} Payrolls\n- ${notifications.length} Notifications`);

    console.log('Sending data to Deployment Server (via API)...');
    const response = await fetch(DEPLOYMENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        users,
        attendance,
        leaves,
        payrolls,
        notifications,
        clearFirst: true // Wipe the cloud database first
      })
    });

    const result = await response.json();
    console.log('Response from server:', result);

    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
}

syncToCloud();
