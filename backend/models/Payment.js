const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  paymentType: { type: String, enum: ['bank_transfer', 'payhere'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'LKR' },
  month: { type: Number, min: 1, max: 12 },
  year: { type: Number },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'refunded'], default: 'pending', index: true },
  slipUrl: { type: String, default: '' },
  slipUploadedAt: Date,
  payhereOrderId: { type: String, index: true },
  payhereData: { type: Object },
  teacherNote: { type: String, default: '' },
  approvedAt: Date,
  rejectedAt: Date,
}, { timestamps: true });

paymentSchema.index({ studentId: 1, classId: 1, month: 1, year: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
