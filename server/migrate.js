const mongoose = require('mongoose');

const User = require('./models/User');
const Attendance = require('./models/Attendance');
const LeaveRequest = require('./models/LeaveRequest');
const Payroll = require('./models/Payroll');
const Notification = require('./models/Notification');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/dayflow';
const ATLAS_URI = 'mongodb+srv://2309poojamurugan_db_user:Pooja2006%40@cluster0.xsl37fp.mongodb.net/dayflow?retryWrites=true&w=majority';

async function migrateData() {
  try {
    console.log('🔗 Connecting to Local Database...');
    const localDb = await mongoose.createConnection(LOCAL_URI).asPromise();
    
    console.log('🔗 Connecting to Atlas Database...');
    const atlasDb = await mongoose.createConnection(ATLAS_URI).asPromise();

    // Models for Local
    const LocalUser = localDb.model('User', User.schema);
    const LocalAttendance = localDb.model('Attendance', Attendance.schema);
    const LocalLeave = localDb.model('LeaveRequest', LeaveRequest.schema);
    const LocalPayroll = localDb.model('Payroll', Payroll.schema);
    const LocalNotif = localDb.model('Notification', Notification.schema);

    // Models for Atlas
    const AtlasUser = atlasDb.model('User', User.schema);
    const AtlasAttendance = atlasDb.model('Attendance', Attendance.schema);
    const AtlasLeave = atlasDb.model('LeaveRequest', LeaveRequest.schema);
    const AtlasPayroll = atlasDb.model('Payroll', Payroll.schema);
    const AtlasNotif = atlasDb.model('Notification', Notification.schema);

    console.log('🧹 Clearing Atlas Database...');
    await AtlasUser.deleteMany({});
    await AtlasAttendance.deleteMany({});
    await AtlasLeave.deleteMany({});
    await AtlasPayroll.deleteMany({});
    await AtlasNotif.deleteMany({});

    console.log('📦 Fetching data from Local Database...');
    const users = await LocalUser.find().lean();
    const attendance = await LocalAttendance.find().lean();
    const leaves = await LocalLeave.find().lean();
    const payrolls = await LocalPayroll.find().lean();
    const notifs = await LocalNotif.find().lean();

    console.log(`Found ${users.length} Users, ${attendance.length} Attendance records, ${payrolls.length} Payrolls.`);

    console.log('🚀 Uploading data to Atlas Cloud...');
    if (users.length) await AtlasUser.insertMany(users);
    if (attendance.length) await AtlasAttendance.insertMany(attendance);
    if (leaves.length) await AtlasLeave.insertMany(leaves);
    if (payrolls.length) await AtlasPayroll.insertMany(payrolls);
    if (notifs.length) await AtlasNotif.insertMany(notifs);

    console.log('✅ Migration Complete! All your local data is now in the cloud.');
    
    await localDb.close();
    await atlasDb.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration Failed:', err);
    process.exit(1);
  }
}

migrateData();
