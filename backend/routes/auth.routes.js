const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { COURSES, SRI_LANKA_DISTRICTS } = require('../config/constants');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/logout', ctrl.logout);
router.post('/refresh', ctrl.refresh);
router.get('/me', authenticate, ctrl.me);

router.get('/options', (req, res) => {
  res.json({ courses: COURSES, districts: SRI_LANKA_DISTRICTS });
});

module.exports = router;
