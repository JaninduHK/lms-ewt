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

const monthSchema = new mongoose.Schema({
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  price: { type: Number, required: true, min: 0 },
  isPublished: { type: Boolean, default: true },
  videos: [videoSchema],
  materials: [materialSchema],
  zoomLinks: [zoomSchema],
  videoCount: { type: Number, default: 0 },
  materialCount: { type: Number, default: 0 },
  zoomCount: { type: Number, default: 0 },
}, { timestamps: true });

const classSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  type: { type: String, enum: ['subscription', 'onetime'], required: true },
  // For onetime: the actual price. For subscription: default price for new months.
  price: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'LKR' },
  isPublished: { type: Boolean, default: false },
  // Onetime classes use the root-level content arrays:
  videos: [videoSchema],
  materials: [materialSchema],
  zoomLinks: [zoomSchema],
  // Subscription classes use months[]:
  months: [monthSchema],
  enrollmentCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

classSchema.pre('validate', function (next) {
  if (this.type === 'subscription') {
    if ((this.videos && this.videos.length) ||
        (this.materials && this.materials.length) ||
        (this.zoomLinks && this.zoomLinks.length)) {
      return next(new Error('Subscription classes must not have root-level videos/materials/zoomLinks — use months[]'));
    }
    const seen = new Set();
    for (const m of this.months || []) {
      const key = `${m.year}-${m.month}`;
      if (seen.has(key)) return next(new Error(`Duplicate month ${key} in months[]`));
      seen.add(key);
    }
  } else if (this.type === 'onetime') {
    if (this.months && this.months.length) {
      return next(new Error('Onetime classes must not have months[] — use root-level arrays'));
    }
  }
  next();
});

module.exports = mongoose.model('Class', classSchema);
