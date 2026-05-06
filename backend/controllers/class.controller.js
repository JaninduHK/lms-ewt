const Class = require('../models/Class');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const { detectVideo } = require('../utils/embed');

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
    let hasAccess = false;
    let accessReason = null;
    if (req.user?.role === 'student') {
      const e = await Enrollment.findOne({ studentId: req.user._id, classId: cls._id, status: 'active' });
      enrolled = !!e;
      if (enrolled) {
        if (cls.type === 'subscription') {
          const day = new Date().getDate();
          if (day <= 10) { hasAccess = true; accessReason = 'free_window'; }
          else {
            const month = new Date().getMonth() + 1;
            const year = new Date().getFullYear();
            const paid = await Payment.findOne({ studentId: req.user._id, classId: cls._id, month, year, status: 'approved' });
            hasAccess = !!paid;
            accessReason = paid ? 'paid_subscription' : 'payment_required';
          }
        } else {
          const paid = await Payment.findOne({ studentId: req.user._id, classId: cls._id, status: 'approved' });
          hasAccess = !!paid;
          accessReason = paid ? 'paid_onetime' : 'payment_required';
        }
      }
    } else if (req.user?.role === 'teacher') {
      hasAccess = true;
    }

    // Public detail strips content
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

const content = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json({
      class: {
        _id: cls._id,
        title: cls.title,
        description: cls.description,
        type: cls.type,
        videos: cls.videos.sort((a, b) => a.order - b.order),
        materials: cls.materials,
        zoomLinks: cls.zoomLinks.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)),
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
    const allowed = ['title', 'description', 'thumbnail', 'type', 'price', 'currency', 'isPublished'];
    const patch = {};
    allowed.forEach(k => { if (k in req.body) patch[k] = req.body[k]; });
    const cls = await Class.findByIdAndUpdate(req.params.id, patch, { new: true });
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

const addVideo = async (req, res, next) => {
  try {
    const { title, url } = req.body;
    if (!title || !url) return res.status(400).json({ message: 'title and url required' });
    const detected = detectVideo(url);
    if (!detected) return res.status(400).json({ message: 'Unsupported video URL (YouTube/Vimeo only)' });
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    cls.videos.push({ title, url, ...detected, order: cls.videos.length });
    await cls.save();
    res.status(201).json({ class: cls });
  } catch (err) { next(err); }
};

const removeVideo = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    cls.videos = cls.videos.filter(v => v._id.toString() !== req.params.videoId);
    cls.videos.forEach((v, i) => { v.order = i; });
    await cls.save();
    res.json({ class: cls });
  } catch (err) { next(err); }
};

const reorderVideos = async (req, res, next) => {
  try {
    const { order } = req.body; // array of video _ids in new order
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
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
    const { title, fileUrl, fileType, fileSize } = req.body;
    if (!fileUrl || !/^https:\/\/res\.cloudinary\.com\//.test(fileUrl)) {
      return res.status(400).json({ message: 'Valid file upload required' });
    }
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
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
    cls.materials = cls.materials.filter(m => m._id.toString() !== req.params.materialId);
    await cls.save();
    res.json({ class: cls });
  } catch (err) { next(err); }
};

const addZoom = async (req, res, next) => {
  try {
    const { title, url, scheduledAt, duration } = req.body;
    if (!title || !url || !scheduledAt) return res.status(400).json({ message: 'title, url, scheduledAt required' });
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    cls.zoomLinks.push({ title, url, scheduledAt, duration: duration || 60 });
    await cls.save();
    res.status(201).json({ class: cls });
  } catch (err) { next(err); }
};

const removeZoom = async (req, res, next) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    cls.zoomLinks = cls.zoomLinks.filter(z => z._id.toString() !== req.params.zoomId);
    await cls.save();
    res.json({ class: cls });
  } catch (err) { next(err); }
};

module.exports = {
  list, detail, content, create, update, remove,
  addVideo, removeVideo, reorderVideos,
  addMaterial, removeMaterial,
  addZoom, removeZoom,
};
