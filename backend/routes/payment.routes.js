const router = require('express').Router();
const express = require('express');
const ctrl = require('../controllers/payment.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { slipUpload } = require('../middleware/upload.middleware');

// PayHere webhook (public, form-encoded)
router.post('/payhere/notify', express.urlencoded({ extended: true }), ctrl.payhereNotify);

router.post('/bank-transfer', authenticate, requireRole('student'), slipUpload.single('slip'), ctrl.submitBankTransfer);
router.post('/payhere/init', authenticate, requireRole('student'), ctrl.initPayHere);
router.get('/my', authenticate, requireRole('student'), ctrl.myPayments);

router.get('/', authenticate, requireRole('teacher'), ctrl.list);
router.put('/:id/approve', authenticate, requireRole('teacher'), ctrl.approve);
router.put('/:id/reject', authenticate, requireRole('teacher'), ctrl.reject);

module.exports = router;
