const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bankDetails: {
    bankName: { type: String, default: '' },
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    branch: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    instructions: { type: String, default: '' },
  },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
