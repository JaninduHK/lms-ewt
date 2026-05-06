const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storageFor = (subdir) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', subdir);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`);
  },
});

const slipFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPG, PNG or PDF allowed'));
};

const slipUpload = multer({
  storage: storageFor('slips'),
  fileFilter: slipFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const materialUpload = multer({
  storage: storageFor('materials'),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const thumbUpload = multer({
  storage: storageFor('thumbnails'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { slipUpload, materialUpload, thumbUpload };
