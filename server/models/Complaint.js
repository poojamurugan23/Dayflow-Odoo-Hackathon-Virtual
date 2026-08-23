const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  generated_letter_url: { type: String, default: '' }, // Base64 or URL of generated PDF
  admin_notes: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);
