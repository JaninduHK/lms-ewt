const Settings = require('../models/Settings');
const User = require('../models/User');

const get = async (req, res, next) => {
  try {
    const teacher = await User.findOne({ role: 'teacher' });
    if (!teacher) return res.json({ settings: null });
    let settings = await Settings.findOne({ teacherId: teacher._id });
    if (!settings) {
      settings = await Settings.create({ teacherId: teacher._id });
    }
    res.json({ settings });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { bankName, accountName, accountNumber, branch, whatsapp, instructions } = req.body;
    const settings = await Settings.findOneAndUpdate(
      { teacherId: req.user._id },
      {
        teacherId: req.user._id,
        bankDetails: { bankName, accountName, accountNumber, branch, whatsapp, instructions },
      },
      { new: true, upsert: true }
    );
    res.json({ settings });
  } catch (err) { next(err); }
};

module.exports = { get, update };
