const mongoose = require('mongoose');
const User = require('./server/models/User');

const MONGO_URI = 'mongodb://127.0.0.1:27017/dayflow';

async function fixIds() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({});
  
  for (let user of users) {
    const companyName = user.company_name || 'Odoo India';
    const companyInitials = companyName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
    
    let nameInitials = 'USER';
    if (user.name) {
      const parts = user.name.split(' ');
      if (parts.length >= 2) {
        nameInitials = (parts[0].substring(0, 2) + parts[parts.length-1].substring(0, 2)).toUpperCase();
      } else {
        nameInitials = parts[0].substring(0, 4).toUpperCase();
      }
    }
    
    const year = user.joining_date ? new Date(user.joining_date).getFullYear() : 2026;
    
    const serial = user.login_id ? user.login_id.slice(-4) : Math.floor(Math.random() * 1000).toString().padStart(4, '0');
    
    const newLoginId = `${companyInitials}${nameInitials}${year}${serial}`;
    console.log(`Updating ${user.name}: ${user.login_id} -> ${newLoginId}`);
    
    user.login_id = newLoginId;
    await user.save();
  }
  
  console.log('Done fixing IDs');
  process.exit(0);
}

fixIds();
