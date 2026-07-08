const User = require('../models/User');
const { signAccess, signRefresh, verifyRefresh, cookieOptions } = require('../utils/jwt');
const { COURSES, SRI_LANKA_DISTRICTS } = require('../config/constants');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const register = async (req, res, next) => {
  try {
    const {
      firstName, lastName, email,
      password, passwordConfirm,
      course, whatsapp, school, district,
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (password !== passwordConfirm) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (course && !COURSES.includes(course)) {
      return res.status(400).json({ message: 'Invalid course' });
    }
    if (district && !SRI_LANKA_DISTRICTS.includes(district)) {
      return res.status(400).json({ message: 'Invalid district' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      course,
      whatsapp,
      school,
      district,
      role: 'student',
    });

    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);
    user.refreshTokens.push(refreshToken);
    await user.save();

    res
      .cookie('accessToken', accessToken, cookieOptions(1 / 96))
      .cookie('refreshToken', refreshToken, cookieOptions(7))
      .status(201)
      .json({ user: user.toSafeJSON() });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    const normalized = identifier.trim();
    const isEmail = normalized.includes('@');
    const user = isEmail
      ? await User.findOne({ email: normalized.toLowerCase() })
      : await User.findOne({
          $or: [
            { studentId: { $regex: `^${escapeRegExp(normalized)}$`, $options: 'i' } },
            { username: normalized.toLowerCase() },
            { email: normalized.toLowerCase() },
          ],
        });

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);
    user.refreshTokens.push(refreshToken);
    await user.save();

    res
      .cookie('accessToken', accessToken, cookieOptions(1 / 96))
      .cookie('refreshToken', refreshToken, cookieOptions(7))
      .json({ user: user.toSafeJSON() });
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await User.updateOne(
        { refreshTokens: token },
        { $pull: { refreshTokens: token } }
      );
    }
    res
      .clearCookie('accessToken')
      .clearCookie('refreshToken')
      .json({ message: 'Logged out' });
  } catch (err) { next(err); }
};

const me = async (req, res) => {
  res.json({ user: req.user });
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token' });
    const decoded = verifyRefresh(token);
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(token)) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const accessToken = signAccess(user);
    res.cookie('accessToken', accessToken, cookieOptions(1 / 96)).json({ ok: true });
  } catch (err) {
    res.clearCookie('accessToken').clearCookie('refreshToken');
    return res.status(401).json({ message: 'Refresh failed' });
  }
};

module.exports = { register, login, logout, me, refresh };
