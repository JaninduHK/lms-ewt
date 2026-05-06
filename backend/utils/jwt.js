const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';

const signAccess = (user) =>
  jwt.sign({ id: user._id, role: user.role }, ACCESS_SECRET, { expiresIn: '15m' });

const signRefresh = (user) =>
  jwt.sign({ id: user._id }, REFRESH_SECRET, { expiresIn: '7d' });

const verifyAccess = (token) => jwt.verify(token, ACCESS_SECRET);
const verifyRefresh = (token) => jwt.verify(token, REFRESH_SECRET);

const cookieOptions = (days) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: days * 24 * 60 * 60 * 1000,
});

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh, cookieOptions };
