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
  
  // Resume Info
  about: { type: String, default: 'Write a short bio about yourself.' },
  job_love: { type: String, default: 'What do you love about your job?' },
  hobbies: { type: String, default: 'List your interests and hobbies here.' },
  skills: { type: [String], default: [] },
  certifications: { type: [String], default: [] },
  
  // Private Info
  address: { type: String, default: '' },
  bank_name: { type: String, default: '' },
  account_number: { type: String, default: '' },
  ifsc_code: { type: String, default: '' },
  emergency_contact_name: { type: String, default: '' },
  emergency_contact_phone: { type: String, default: '' },
  dob: { type: Date },
  nationality: { type: String, default: '' },
  gender: { type: String, default: '' },
  marital_status: { type: String, default: '' },
  
  // Salary / Compensation Info
  month_wage: { type: Number, default: 50000 },
  working_days: { type: Number, default: 5 },
  break_time: { type: Number, default: 1 }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
