const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { sign } = require('../controllers/upload.controller');

router.post('/sign', authenticate, sign);

module.exports = router;
