const router = require('express').Router();
const ctrl = require('../controllers/enrollment.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.post('/', authenticate, requireRole('student'), ctrl.enroll);
router.get('/my', authenticate, requireRole('student'), ctrl.myEnrollments);
router.get('/class/:classId', authenticate, requireRole('teacher'), ctrl.classEnrollments);

module.exports = router;
