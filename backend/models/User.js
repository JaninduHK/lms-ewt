const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./Counter');
const { COURSES, SRI_LANKA_DISTRICTS } = require('../config/constants');

const userSchema = new mongoose.Schema({
  studentId: { type: String, unique: true, sparse: true, index: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 8 },
  course: { type: String, enum: COURSES },
  whatsapp: { type: String, trim: true },
  school: { type: String, trim: true },
  district: { type: String, enum: SRI_LANKA_DISTRICTS },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  refreshTokens: [{ type: String }],
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  if (this.isNew && this.role === 'student' && !this.studentId) {
    const seq = await Counter.next('studentId');
    this.studentId = 'EC' + String(seq).padStart(6, '0');
  }
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
