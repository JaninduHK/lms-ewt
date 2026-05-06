const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');

const enroll = async (req, res, next) => {
  try {
    const { classId } = req.body;
    if (!classId) return res.status(400).json({ message: 'classId required' });
    const cls = await Class.findById(classId);
    if (!cls || !cls.isPublished) return res.status(404).json({ message: 'Class not found' });

    const existing = await Enrollment.findOne({ studentId: req.user._id, classId });
    if (existing) {
      return res.status(200).json({ enrollment: existing, alreadyEnrolled: true });
    }

    const enrollment = await Enrollment.create({ studentId: req.user._id, classId });
    await Class.updateOne({ _id: classId }, { $inc: { enrollmentCount: 1 } });
    res.status(201).json({ enrollment });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Already enrolled' });
    }
    next(err);
  }
};

const myEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ studentId: req.user._id, status: 'active' })
      .populate('classId')
      .sort('-enrolledAt');
    res.json({ enrollments });
  } catch (err) { next(err); }
};

const classEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ classId: req.params.classId })
      .populate('studentId', 'firstName lastName studentId email whatsapp school district course')
      .sort('-enrolledAt');
    res.json({ enrollments });
  } catch (err) { next(err); }
};

module.exports = { enroll, myEnrollments, classEnrollments };
