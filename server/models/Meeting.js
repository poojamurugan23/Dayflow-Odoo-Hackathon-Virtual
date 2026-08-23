const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  host_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  accepted_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  rejected_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  link: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('Meeting', meetingSchema);
