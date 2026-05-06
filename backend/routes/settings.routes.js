const router = require('express').Router();
const ctrl = require('../controllers/settings.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/', authenticate, ctrl.get);
router.put('/', authenticate, requireRole('teacher'), ctrl.update);

module.exports = router;
