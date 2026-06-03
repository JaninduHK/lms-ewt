const mongoose = require('mongoose');

// One record per (student, video). Count goes up as the student presses play.
// Locks when count >= the video's maxViews on the Class document.
const videoViewSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  classId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  videoId:   { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  // For subscription class videos — null for onetime root-level videos
  year:  { type: Number, default: null },
  month: { type: Number, default: null },
  count: { type: Number, default: 0 },
  lastViewedAt: Date,
}, { timestamps: true });

videoViewSchema.index({ studentId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('VideoView', videoViewSchema);
