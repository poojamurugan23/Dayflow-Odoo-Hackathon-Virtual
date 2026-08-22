const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/dayflow';

async function fixIds() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({}).sort({ created_at: 1 });
  
  // Group users by joining year to calculate serial correctly
  const yearCounts = {};
  
  for (let user of users) {
    const joiningYear = user.joining_date 
      ? new Date(user.joining_date).getFullYear() 
      : new Date(user.created_at).getFullYear();
    
    // Always "OI" for Odoo India
    const companyPrefix = 'OI';
    
    // First 2 letters of first name + first 2 letters of last name
    let nameCode = 'XXXX';
    if (user.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        nameCode = (parts[0].substring(0, 2) + parts[parts.length - 1].substring(0, 2)).toUpperCase();
      } else {
        nameCode = parts[0].substring(0, 4).toUpperCase();
      }
    }
    
    // Serial number for this year
    if (!yearCounts[joiningYear]) yearCounts[joiningYear] = 0;
    yearCounts[joiningYear]++;
    const serial = yearCounts[joiningYear].toString().padStart(4, '0');
    
    const newLoginId = `${companyPrefix}${nameCode}${joiningYear}${serial}`;
    console.log(`${user.name}: ${user.login_id} -> ${newLoginId}`);
    
    user.login_id = newLoginId;
    await user.save();
  }
  
  console.log('All Login IDs fixed!');
  process.exit(0);
}

fixIds();
