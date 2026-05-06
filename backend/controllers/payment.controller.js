const Payment = require('../models/Payment');
const Class = require('../models/Class');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { generateHash, verifyNotifyHash } = require('../utils/payhere');

const submitBankTransfer = async (req, res, next) => {
  try {
    const { classId, month, year } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Slip file required' });
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const enrolled = await Enrollment.findOne({ studentId: req.user._id, classId });
    if (!enrolled) return res.status(403).json({ message: 'Enroll in the class first' });

    const slipUrl = `/uploads/slips/${req.file.filename}`;
    const data = {
      studentId: req.user._id,
      classId,
      paymentType: 'bank_transfer',
      amount: cls.price,
      currency: cls.currency,
      slipUrl,
      slipUploadedAt: new Date(),
      status: 'pending',
    };
    if (cls.type === 'subscription') {
      const m = parseInt(month) || (new Date().getMonth() + 1);
      const y = parseInt(year) || new Date().getFullYear();
      data.month = m;
      data.year = y;
    }
    const payment = await Payment.create(data);
    res.status(201).json({ payment });
  } catch (err) { next(err); }
};

const initPayHere = async (req, res, next) => {
  try {
    const { classId, month, year } = req.body;
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const enrolled = await Enrollment.findOne({ studentId: req.user._id, classId });
    if (!enrolled) return res.status(403).json({ message: 'Enroll in the class first' });

    const orderId = `EC-${Date.now()}-${req.user.studentId || req.user._id.toString().slice(-6)}`;
    const data = {
      studentId: req.user._id,
      classId,
      paymentType: 'payhere',
      amount: cls.price,
      currency: cls.currency,
      payhereOrderId: orderId,
      status: 'pending',
    };
    if (cls.type === 'subscription') {
      data.month = parseInt(month) || (new Date().getMonth() + 1);
      data.year = parseInt(year) || new Date().getFullYear();
    }
    const payment = await Payment.create(data);

    const merchantId = process.env.PAYHERE_MERCHANT_ID || '';
    const secret = process.env.PAYHERE_MERCHANT_SECRET || '';
    const hash = secret ? generateHash({
      merchantId, orderId, amount: cls.price, currency: cls.currency, secret,
    }) : null;

    res.json({
      payment,
      checkout: {
        sandbox: (process.env.PAYHERE_MODE || 'sandbox') === 'sandbox',
        merchant_id: merchantId,
        return_url: process.env.PAYHERE_RETURN_URL,
        cancel_url: process.env.PAYHERE_CANCEL_URL,
        notify_url: process.env.PAYHERE_NOTIFY_URL,
        order_id: orderId,
        items: cls.title,
        amount: Number(cls.price).toFixed(2),
        currency: cls.currency,
        first_name: req.user.firstName,
        last_name: req.user.lastName,
        email: req.user.email,
        phone: req.user.whatsapp || '',
        address: '',
        city: req.user.district || '',
        country: 'Sri Lanka',
        hash,
      },
    });
  } catch (err) { next(err); }
};

const payhereNotify = async (req, res, next) => {
  try {
    const body = req.body;
    const secret = process.env.PAYHERE_MERCHANT_SECRET;
    if (secret && !verifyNotifyHash(body, secret)) {
      return res.status(400).send('Invalid signature');
    }
    const payment = await Payment.findOne({ payhereOrderId: body.order_id });
    if (!payment) return res.status(404).send('Order not found');
    payment.payhereData = body;
    if (body.status_code === '2') {
      payment.status = 'approved';
      payment.approvedAt = new Date();
    } else if (body.status_code === '0') {
      payment.status = 'pending';
    } else {
      payment.status = 'rejected';
      payment.rejectedAt = new Date();
    }
    await payment.save();
    res.send('OK');
  } catch (err) { next(err); }
};

const myPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ studentId: req.user._id })
      .populate('classId', 'title type currency')
      .sort('-createdAt');
    res.json({ payments });
  } catch (err) { next(err); }
};

// Teacher list with filters
const list = async (req, res, next) => {
  try {
    const {
      status, paymentType, classId, month, year, search,
      page = 1, limit = 20,
    } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (paymentType && paymentType !== 'all') filter.paymentType = paymentType;
    if (classId) filter.classId = classId;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      filter.studentId = { $in: users.map(u => u._id) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('studentId', 'firstName lastName studentId email whatsapp')
        .populate('classId', 'title type currency')
        .sort('-createdAt')
        .skip(skip).limit(parseInt(limit)),
      Payment.countDocuments(filter),
    ]);

    // Stats bar
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    const [pendingCount, approvedThisMonth, revenueAgg, splitAgg] = await Promise.all([
      Payment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({
        status: 'approved',
        approvedAt: { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) },
      }),
      Payment.aggregate([
        { $match: { status: 'approved', approvedAt: { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$paymentType', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      payments,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
      stats: {
        pendingCount,
        approvedThisMonth,
        revenueThisMonth: revenueAgg[0]?.total || 0,
        split: splitAgg.reduce((acc, x) => ({ ...acc, [x._id]: { count: x.count, total: x.total } }), {}),
      },
    });
  } catch (err) { next(err); }
};

const approve = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    payment.status = 'approved';
    payment.approvedAt = new Date();
    payment.teacherNote = '';
    await payment.save();
    res.json({ payment });
  } catch (err) { next(err); }
};

const reject = async (req, res, next) => {
  try {
    const { teacherNote } = req.body;
    if (!teacherNote) return res.status(400).json({ message: 'Rejection reason required' });
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    payment.status = 'rejected';
    payment.rejectedAt = new Date();
    payment.teacherNote = teacherNote;
    await payment.save();
    res.json({ payment });
  } catch (err) { next(err); }
};

module.exports = {
  submitBankTransfer, initPayHere, payhereNotify, myPayments,
  list, approve, reject,
};
