const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  platform: { type: String, enum: ['youtube', 'vimeo'], required: true },
  url: { type: String, required: true },
  embedId: { type: String, required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: String,
  fileSize: Number,
  uploadedAt: { type: Date, default: Date.now },
});

const zoomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 },
});

const classSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  type: { type: String, enum: ['subscription', 'onetime'], required: true },
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'LKR' },
  isPublished: { type: Boolean, default: false },
  videos: [videoSchema],
  materials: [materialSchema],
  zoomLinks: [zoomSchema],
  enrollmentCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
