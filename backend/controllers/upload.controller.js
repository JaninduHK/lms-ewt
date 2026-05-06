const cloudinary = require('../config/cloudinary');

const ALLOWED_FOLDERS = {
  slips: { role: 'student' },
  materials: { role: 'teacher' },
  thumbnails: { role: 'teacher' },
};

// Returns a short-lived Cloudinary signature so the browser can upload directly.
const sign = (req, res, next) => {
  try {
    const { folder } = req.body || {};
    const cfg = ALLOWED_FOLDERS[folder];
    if (!cfg) return res.status(400).json({ message: 'Invalid folder' });
    if (cfg.role && req.user.role !== cfg.role && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folderPath = `ewt/${folder}`;
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: folderPath },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      timestamp,
      signature,
      folder: folderPath,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (err) { next(err); }
};

module.exports = { sign };
