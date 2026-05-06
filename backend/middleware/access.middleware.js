const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const Class = require('../models/Class');

// Verify enrollment exists for the requesting student + classId in params
const checkEnrollment = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') return next();
    const classId = req.params.id || req.params.classId;
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,
      classId,
      status: 'active',
    });
    if (!enrollment) {
      return res.status(403).json({ message: 'Please enroll in this class first', code: 'NOT_ENROLLED' });
    }
    req.enrollment = enrollment;
    next();
  } catch (err) {
    next(err);
  }
};

// Full access gate: enrollment + payment logic for subscription/onetime
const checkClassAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'teacher' || req.user.role === 'admin') return next();

    const classId = req.params.id || req.params.classId;
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,
      classId,
      status: 'active',
    });
    if (!enrollment) {
      return res.status(403).json({ message: 'Please enroll in this class first', code: 'NOT_ENROLLED' });
    }

    if (cls.type === 'subscription') {
      const now = new Date();
      const day = now.getDate();
      if (day <= 10) {
        req.accessReason = 'free_window';
        return next();
      }
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const paid = await Payment.findOne({
        studentId: req.user._id,
        classId,
        month,
        year,
        status: 'approved',
      });
      if (!paid) {
        return res.status(403).json({
          message: `Payment required for ${month}/${year} to access this class`,
          code: 'PAYMENT_REQUIRED',
          classType: 'subscription',
          month,
          year,
        });
      }
      req.accessReason = 'paid_subscription';
      return next();
    }

    // onetime
    const paid = await Payment.findOne({
      studentId: req.user._id,
      classId,
      status: 'approved',
    });
    if (!paid) {
      return res.status(403).json({
        message: 'Purchase required to access this class',
        code: 'PAYMENT_REQUIRED',
        classType: 'onetime',
      });
    }
    req.accessReason = 'paid_onetime';
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkEnrollment, checkClassAccess };
