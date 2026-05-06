const router = require('express').Router();
const ctrl = require('../controllers/student.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.use(authenticate, requireRole('teacher'));

router.get('/', ctrl.list);
router.get('/export', ctrl.exportCSV);
router.get('/:id', ctrl.detail);

module.exports = router;
