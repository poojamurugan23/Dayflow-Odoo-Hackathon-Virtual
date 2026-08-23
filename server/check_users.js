const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dayflow').then(async () => {
  const users = await User.find({ role: { $in: ['admin', 'hr'] } });
  console.log(users.map(u => ({ name: u.name, login_id: u.login_id, role: u.role })));
  process.exit(0);
});
