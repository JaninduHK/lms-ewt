const Enrollment = require('../models/Enrollment');
const Class = require('../models/Class');
const User = require('../models/User');
const Payment = require('../models/Payment');

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

// Teacher manually enrolls a student into a class. Optionally also grants
// access (an approved Payment) so the student doesn't have to pay/wait for
// approval — enrollment alone never unlocks content, see access.middleware.js.
const enrollByTeacher = async (req, res, next) => {
  try {
    const { studentId, classId, grantAccess, month, year } = req.body;
    if (!studentId || !classId) {
      return res.status(400).json({ message: 'studentId and classId required' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    let enrollment = await Enrollment.findOne({ studentId, classId });
    let created = false;
    if (!enrollment) {
      enrollment = await Enrollment.create({ studentId, classId });
      await Class.updateOne({ _id: classId }, { $inc: { enrollmentCount: 1 } });
      created = true;
    } else if (enrollment.status !== 'active') {
      enrollment.status = 'active';
      await enrollment.save();
    }

    let payment = null;
    if (grantAccess) {
      const paymentFilter = { studentId, classId, status: 'approved' };
      const paymentData = {
        studentId,
        classId,
        paymentType: 'manual',
        amount: 0,
        currency: cls.currency,
        status: 'approved',
        approvedAt: new Date(),
        teacherNote: `Manually granted by ${req.user.firstName} ${req.user.lastName}`,
      };

      if (cls.type === 'subscription') {
        const m = parseInt(month);
        const y = parseInt(year);
        if (!m || !y) {
          return res.status(400).json({ message: 'month and year required to grant access for a subscription class' });
        }
        const monthDoc = (cls.months || []).find(x => x.month === m && x.year === y);
        if (!monthDoc) return res.status(404).json({ message: 'Month not found' });
        paymentFilter.month = m;
        paymentFilter.year = y;
        paymentData.month = m;
        paymentData.year = y;
      }

      payment = await Payment.findOne(paymentFilter);
      if (!payment) payment = await Payment.create(paymentData);
    }

    res.status(created ? 201 : 200).json({ enrollment, payment, alreadyEnrolled: !created });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Already enrolled' });
    }
    next(err);
  }
};

const classEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ classId: req.params.classId })
      .populate('studentId', 'firstName lastName studentId email whatsapp school district course')
      .sort('-enrolledAt');
    res.json({ enrollments });
  } catch (err) { next(err); }
};

module.exports = { enroll, myEnrollments, classEnrollments, enrollByTeacher };
