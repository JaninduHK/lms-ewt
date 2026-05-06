const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  enrolledAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
}, { timestamps: true });

enrollmentSchema.index({ studentId: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
