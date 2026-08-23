/**
 * migrate_via_api.js
 * 
 * Reads ALL data from your local MongoDB and uploads it
 * to the live Render server via HTTPS (no direct Atlas connection needed).
 */

const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const LeaveRequest = require('./models/LeaveRequest');
const Payroll = require('./models/Payroll');
const Notification = require('./models/Notification');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/dayflow';
const RENDER_API = 'https://dayflow-api-n4i2.onrender.com/api/import-all';

async function migrate() {
  try {
    console.log('🔗 Connecting to your LOCAL database...');
    await mongoose.connect(LOCAL_URI);
    console.log('✅ Connected to local MongoDB!\n');

    console.log('📦 Reading all your data...');
    const users = await User.find().lean();
    const attendance = await Attendance.find().lean();
    const leaves = await LeaveRequest.find().lean();
    const payrolls = await Payroll.find().lean();
    const notifications = await Notification.find().lean();

    console.log(`   👤 Users: ${users.length}`);
    console.log(`   📅 Attendance records: ${attendance.length}`);
    console.log(`   🏖️  Leave requests: ${leaves.length}`);
    console.log(`   💰 Payroll records: ${payrolls.length}`);
    console.log(`   🔔 Notifications: ${notifications.length}`);
    console.log('');

    if (users.length === 0) {
      console.log('⚠️  No data found in local database! Nothing to migrate.');
      process.exit(0);
    }

    console.log('🚀 Uploading ALL data to live Render server via HTTPS...');
    console.log('   (This bypasses the MongoDB Atlas firewall issue)\n');

    const response = await fetch(RENDER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        users,
        attendance,
        leaves,
        payrolls,
        notifications,
        clearFirst: true  // Clear old cloud data first, then insert fresh
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅✅✅ MIGRATION SUCCESSFUL! ✅✅✅');
      console.log('');
      console.log('Uploaded counts:', JSON.stringify(result.counts, null, 2));
      console.log('');
      console.log('🎉 All your local data is now LIVE on your website!');
      console.log('👉 Go to your Vercel website and refresh the page.');
      console.log('👉 Login with the same credentials you use locally.');
    } else {
      console.error('❌ Server error:', result);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
