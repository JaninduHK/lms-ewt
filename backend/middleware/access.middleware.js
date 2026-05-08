const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const Class = require('../models/Class');

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

// Onetime classes: enrollment + any approved Payment grants lifetime access.
// Subscription classes are gated per-month by checkMonthAccess instead.
const checkClassAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'teacher' || req.user.role === 'admin') return next();

    const classId = req.params.id || req.params.classId;
    const cls = await Class.findById(classId).select('type');
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    if (cls.type !== 'onetime') {
      return res.status(400).json({
        message: 'This route is for onetime classes. Use /months/:year/:month/content.',
        code: 'USE_MONTH_ROUTE',
      });
    }

    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,
      classId,
      status: 'active',
    });
    if (!enrollment) {
      return res.status(403).json({ message: 'Please enroll in this class first', code: 'NOT_ENROLLED' });
    }

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

// Subscription classes: enrollment + approved Payment for the specific {month, year}.
// month.isPublished gates visibility/purchase, NOT access — paid students keep access
// even if the teacher later un-publishes the month.
const checkMonthAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'teacher' || req.user.role === 'admin') return next();

    const classId = req.params.id || req.params.classId;
    const month = parseInt(req.params.month, 10);
    const year = parseInt(req.params.year, 10);
    if (!month || !year || month < 1 || month > 12) {
      return res.status(400).json({ message: 'Invalid month/year' });
    }

    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (cls.type !== 'subscription') {
      return res.status(400).json({ message: 'Not a subscription class', code: 'NOT_SUBSCRIPTION' });
    }
    const monthDoc = (cls.months || []).find(m => m.month === month && m.year === year);
    if (!monthDoc) return res.status(404).json({ message: 'Month not found', code: 'MONTH_NOT_FOUND' });

    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,
      classId,
      status: 'active',
    });
    if (!enrollment) {
      return res.status(403).json({ message: 'Please enroll in this class first', code: 'NOT_ENROLLED' });
    }

    const paid = await Payment.findOne({
      studentId: req.user._id,
      classId,
      month,
      year,
      status: 'approved',
    });
    if (!paid) {
      return res.status(403).json({
        message: `Payment required for ${month}/${year}`,
        code: 'PAYMENT_REQUIRED',
        classType: 'subscription',
        month, year,
      });
    }

    req.classDoc = cls;
    req.monthDoc = monthDoc;
    req.accessReason = 'paid_month';
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkEnrollment, checkClassAccess, checkMonthAccess };
