const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  basic: { type: Number, required: true, default: 0 },
  hra: { type: Number, required: true, default: 0 },
  allowances: { type: Number, required: true, default: 0 },
  bonus: { type: Number, required: true, default: 0 },
  pf: { type: Number, required: true, default: 0 },
  professional_tax: { type: Number, required: true, default: 0 },
  other_deductions: { type: Number, required: true, default: 0 },
  pay_period: { type: String, required: true },
  payment_date: { type: Date }
}, {
  timestamps: true
});

payrollSchema.index({ employee_id: 1, pay_period: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
