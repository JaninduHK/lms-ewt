const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const { detectVideo } = require('../utils/embed');

// ─────────── helpers ───────────

const findMonth = (cls, year, month) =>
  (cls.months || []).find(m => m.month === Number(month) && m.year === Number(year));

const sortMonthsAsc = (months) =>
  [...(months || [])].sort((a, b) => (a.year - b.year) || (a.month - b.month));

const guardOnetime = (cls, res) => {
  if (cls.type === 'subscription') {
    res.status(400).json({
      message: 'Subscription classes use month-scoped routes',
      code: 'SUBSCRIPTION_USE_MONTH',
    });
    return false;
  }
  return true;
};

const guardSubscription = (cls, res) => {
  if (cls.type !== 'subscription') {
    res.status(400).json({ message: 'Not a subscription class', code: 'NOT_SUBSCRIPTION' });
    return false;
  }
  return true;
};

// ─────────── classes ───────────

const list = async (req, res, next) => {
  try {
    const filter = req.user?.role === 'teacher' ? {} : { isPublished: true };
    const classes = await Class.find(filter).sort('-createdAt');
    res.json({ classes });
  } catch (err) { next(err); }
};

const detail = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    let enrolled = false;
    if (req.user?.role === 'student') {
      const e = await Enrollment.findOne({ studentId: req.user._id, classId: cls._id, status: 'active' });
      enrolled = !!e;
    }

    if (cls.type === 'subscription') {
      const months = sortMonthsAsc(cls.months);
      // Filter unpublished months from non-teachers (so they don't see drafts)
      const visibleMonths = req.user?.role === 'teacher'
        ? months
        : months.filter(m => m.isPublished);

      let paymentByPeriod = new Map();
      if (req.user?.role === 'student' && enrolled) {
        const periods = visibleMonths.map(m => ({ month: m.month, year: m.year }));
        if (periods.length) {
          const payments = await Payment.find({
            studentId: req.user._id,
            classId: cls._id,
            $or: periods,
          }).sort('-createdAt');
          for (const p of payments) {
            const k = `${p.year}-${p.month}`;
            if (!paymentByPeriod.has(k)) paymentByPeriod.set(k, p);
          }
        }
      }

      const monthsOut = visibleMonths.map(m => {
        const key = `${m.year}-${m.month}`;
        const pay = paymentByPeriod.get(key);
        return {
          _id: m._id,
          month: m.month,
          year: m.year,
          price: m.price,
          isPublished: m.isPublished,
          videoCount: m.videoCount ?? m.videos.length,
          materialCount: m.materialCount ?? m.materials.length,
          zoomCount: m.zoomCount ?? m.zoomLinks.length,
          zoomPreview: m.zoomLinks.map(z => ({
            _id: z._id, title: z.title, scheduledAt: z.scheduledAt, duration: z.duration,
          })),
          hasAccess: req.user?.role === 'teacher' ? true : (pay?.status === 'approved'),
          paymentStatus: pay?.status || null,
          paymentId: pay?._id || null,
        };
      });

      return res.json({
        class: {
          _id: cls._id,
          title: cls.title,
          description: cls.description,
          thumbnail: cls.thumbnail,
          type: cls.type,
          currency: cls.currency,
          isPublished: cls.isPublished,
          enrollmentCount: cls.enrollmentCount,
          createdAt: cls.createdAt,
          months: monthsOut,
        },
        enrolled,
      });
    }

    // onetime
    let hasAccess = false;
    let accessReason = null;
    if (req.user?.role === 'student' && enrolled) {
      const paid = await Payment.findOne({ studentId: req.user._id, classId: cls._id, status: 'approved' });
      hasAccess = !!paid;
      accessReason = paid ? 'paid_onetime' : 'payment_required';
    } else if (req.user?.role === 'teacher') {
      hasAccess = true;
    }

    const publicFields = {
      _id: cls._id,
      title: cls.title,
      description: cls.description,
      thumbnail: cls.thumbnail,
      type: cls.type,
      price: cls.price,
      currency: cls.currency,
      isPublished: cls.isPublished,
      videoCount: cls.videos.length,
      materialCount: cls.materials.length,
      zoomPreview: cls.zoomLinks.map(z => ({
        _id: z._id, title: z.title, scheduledAt: z.scheduledAt, duration: z.duration,
      })),
      enrollmentCount: cls.enrollmentCount,
      createdAt: cls.createdAt,
    };

    res.json({ class: publicFields, enrolled, hasAccess, accessReason });
  } catch (err) { next(err); }
};

// Onetime-only content endpoint (subscription uses monthContent below).
const content = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (!guardOnetime(cls, res)) return;
    res.json({
      class: {
        _id: cls._id,
        title: cls.title,
        description: cls.description,
        type: cls.type,
        videos: [...cls.videos].sort((a, b) => a.order - b.order),
        materials: cls.materials,
        zoomLinks: [...cls.zoomLinks].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)),
      },
      accessReason: req.accessReason,
    });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { title, description, type, price, currency, thumbnail, isPublished } = req.body;
    if (!title || !type || price == null) {
      return res.status(400).json({ message: 'title, type, and price are required' });
    }
    const cls = await Class.create({
      title, description, type, price, currency, thumbnail,
      isPublished: !!isPublished,
      createdBy: req.user._id,
    });
    res.status(201).json({ class: cls });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'thumbnail', 'price', 'currency', 'isPublished'];
    const patch = {};
    allowed.forEach(k => { if (k in req.body) patch[k] = req.body[k]; });
    const cls = await Class.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json({ class: cls });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const cls = await Class.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    await Enrollment.deleteMany({ classId: cls._id });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

// ─────────── onetime content (root-level arrays) ───────────

const addVideo = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (!guardOnetime(cls, res)) return;
    const { title, url } = req.body;
    if (!title || !url) return res.status(400).json({ message: 'title and url required' });
    const detected = detectVideo(url);
    if (!detected) return res.status(400).json({ message: 'Unsupported video URL (YouTube/Vimeo only)' });
    cls.videos.push({ title, url, ...detected, order: cls.videos.length });
    await cls.save();
    res.status(201).json({ class: cls });
  } catch (err) { next(err); }
};

const removeVideo = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (!guardOnetime(cls, res)) return;
    cls.videos = cls.videos.filter(v => v._id.toString() !== req.params.videoId);
    cls.videos.forEach((v, i) => { v.order = i; });
    await cls.save();
    res.json({ class: cls });
  } catch (err) { next(err); }
};

const reorderVideos = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (!guardOnetime(cls, res)) return;
    const { order } = req.body;
    const map = new Map(cls.videos.map(v => [v._id.toString(), v]));
    cls.videos = order.map((id, i) => {
      const v = map.get(id);
      if (v) v.order = i;
      return v;
    }).filter(Boolean);
    await cls.save();
    res.json({ class: cls });
  } catch (err) { next(err); }
};

const addMaterial = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (!guardOnetime(cls, res)) return;
    const { title, fileUrl, fileType, fileSize } = req.body;
    if (!fileUrl || !/^https:\/\/res\.cloudinary\.com\//.test(fileUrl)) {
      return res.status(400).json({ message: 'Valid file upload required' });
    }
    cls.materials.push({
      title: title || 'Material',
      fileUrl,
      fileType: fileType || '',
      fileSize: fileSize || 0,
    });
    await cls.save();
    res.status(201).json({ class: cls });
  } catch (err) { next(err); }
};

const removeMaterial = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (!guardOnetime(cls, res)) return;
    cls.materials = cls.materials.filter(m => m._id.toString() !== req.params.materialId);
    await cls.save();
    res.json({ class: cls });
  } catch (err) { next(err); }
};

const addZoom = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (!guardOnetime(cls, res)) return;
    const { title, url, scheduledAt, duration } = req.body;
    if (!title || !url || !scheduledAt) return res.status(400).json({ message: 'title, url, scheduledAt required' });
    cls.zoomLinks.push({ title, url, scheduledAt, duration: duration || 60 });
    await cls.save();
    res.status(201).json({ class: cls });
  } catch (err) { next(err); }
};

const removeZoom = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (!guardOnetime(cls, res)) return;
    cls.zoomLinks = cls.zoomLinks.filter(z => z._id.toString() !== req.params.zoomId);
    await cls.save();
    res.json({ class: cls });
  } catch (err) { next(err); }
};

// ─────────── month management (subscription) ───────────

const addMonth = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (!guardSubscription(cls, res)) return;
    const { month, year, price, isPublished } = req.body;
    if (!month || !year) return res.status(400).json({ message: 'month and year required' });
    if (findMonth(cls, year, month)) {
      return res.status(409).json({ message: 'Month already exists for that year' });
    }
    cls.months.push({
      month: Number(month),
      year: Number(year),
      price: price != null ? Number(price) : cls.price,
      isPublished: isPublished !== false,
    });
    await cls.save();
    res.status(201).json({ class: cls });
  } catch (err) { next(err); }
};

const bulkCreateMonths = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (!guardSubscription(cls, res)) return;
    const { year, defaultPrice } = req.body;
    if (!year) return res.status(400).json({ message: 'year required' });
    const price = defaultPrice != null ? Number(defaultPrice) : cls.price;
    let added = 0;
    for (let m = 1; m <= 12; m++) {
      if (!findMonth(cls, year, m)) {
        cls.months.push({ month: m, year: Number(year), price, isPublished: true });
        added++;
      }
    }
    await cls.save();
    res.status(201).json({ class: cls, added });
  } catch (err) { next(err); }
};

const updateMonth = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (!guardSubscription(cls, res)) return;
    const m = findMonth(cls, req.params.year, req.params.month);
    if (!m) return res.status(404).json({ message: 'Month not found' });
    if ('price' in req.body) m.price = Number(req.body.price);
    if ('isPublished' in req.body) m.isPublished = !!req.body.isPublished;
    await cls.save();
    res.json({ class: cls });
  } catch (err) { next(err); }
};

const removeMonth = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (!guardSubscription(cls, res)) return;
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    const paid = await Payment.exists({ classId: cls._id, year, month, status: 'approved' });
    if (paid) {
      return res.status(409).json({
        message: 'Cannot delete a month that students have paid for. Unpublish it instead.',
        code: 'MONTH_HAS_PAID_STUDENTS',
      });
    }
    cls.months = cls.months.filter(m => !(m.month === month && m.year === year));
    await cls.save();
    res.json({ class: cls });
  } catch (err) { next(err); }
};

// ─────────── per-month content (subscription) ───────────

const monthMutator = (handler) => async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    if (!guardSubscription(cls, res)) return;
    const m = findMonth(cls, req.params.year, req.params.month);
    if (!m) return res.status(404).json({ message: 'Month not found' });
    await handler(req, res, cls, m);
    m.videoCount = m.videos.length;
    m.materialCount = m.materials.length;
    m.zoomCount = m.zoomLinks.length;
    await cls.save();
    res.json({ class: cls });
  } catch (err) { next(err); }
};

const addMonthVideo = monthMutator(async (req, res, cls, m) => {
  const { title, url } = req.body;
  if (!title || !url) throw Object.assign(new Error('title and url required'), { status: 400 });
  const detected = detectVideo(url);
  if (!detected) throw Object.assign(new Error('Unsupported video URL'), { status: 400 });
  m.videos.push({ title, url, ...detected, order: m.videos.length });
  res.status(201);
});

const removeMonthVideo = monthMutator(async (req, res, cls, m) => {
  m.videos = m.videos.filter(v => v._id.toString() !== req.params.videoId);
  m.videos.forEach((v, i) => { v.order = i; });
});

const reorderMonthVideos = monthMutator(async (req, res, cls, m) => {
  const { order } = req.body;
  const map = new Map(m.videos.map(v => [v._id.toString(), v]));
  m.videos = order.map((id, i) => {
    const v = map.get(id);
    if (v) v.order = i;
    return v;
  }).filter(Boolean);
});

const addMonthMaterial = monthMutator(async (req, res, cls, m) => {
  const { title, fileUrl, fileType, fileSize } = req.body;
  if (!fileUrl || !/^https:\/\/res\.cloudinary\.com\//.test(fileUrl)) {
    throw Object.assign(new Error('Valid file upload required'), { status: 400 });
  }
  m.materials.push({
    title: title || 'Material',
    fileUrl,
    fileType: fileType || '',
    fileSize: fileSize || 0,
  });
  res.status(201);
});

const removeMonthMaterial = monthMutator(async (req, res, cls, m) => {
  m.materials = m.materials.filter(x => x._id.toString() !== req.params.materialId);
});

const addMonthZoom = monthMutator(async (req, res, cls, m) => {
  const { title, url, scheduledAt, duration } = req.body;
  if (!title || !url || !scheduledAt) {
    throw Object.assign(new Error('title, url, scheduledAt required'), { status: 400 });
  }
  m.zoomLinks.push({ title, url, scheduledAt, duration: duration || 60 });
  res.status(201);
});

const removeMonthZoom = monthMutator(async (req, res, cls, m) => {
  m.zoomLinks = m.zoomLinks.filter(z => z._id.toString() !== req.params.zoomId);
});

// Student-facing per-month content (gated by checkMonthAccess middleware)
const monthContent = async (req, res, next) => {
  try {
    const cls = req.classDoc || await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    const m = req.monthDoc || findMonth(cls, req.params.year, req.params.month);
    if (!m) return res.status(404).json({ message: 'Month not found' });
    res.json({
      class: { _id: cls._id, title: cls.title, type: cls.type },
      month: {
        _id: m._id,
        month: m.month,
        year: m.year,
        videos: [...m.videos].sort((a, b) => a.order - b.order),
        materials: m.materials,
        zoomLinks: [...m.zoomLinks].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)),
      },
      accessReason: req.accessReason,
    });
  } catch (err) { next(err); }
};

module.exports = {
  list, detail, content, create, update, remove,
  // onetime root content
  addVideo, removeVideo, reorderVideos,
  addMaterial, removeMaterial,
  addZoom, removeZoom,
  // months
  addMonth, bulkCreateMonths, updateMonth, removeMonth,
  // per-month content
  addMonthVideo, removeMonthVideo, reorderMonthVideos,
  addMonthMaterial, removeMonthMaterial,
  addMonthZoom, removeMonthZoom,
  monthContent,
};
