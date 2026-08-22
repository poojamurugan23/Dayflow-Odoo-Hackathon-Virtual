const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  login_id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // will be hashed
  role: { type: String, enum: ['admin', 'hr', 'employee'], default: 'employee' },
  name: { type: String, required: true },
  company_name: { type: String },
  phone: { type: String },
  department: { type: String, default: 'Unassigned' },
  position: { type: String, default: 'New Employee' },
  status: { type: String, default: 'Active' },
  joining_date: { type: Date, default: Date.now },
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
