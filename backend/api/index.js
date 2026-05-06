// Vercel serverless entry. All /api/* requests are routed here via vercel.json.
require('dotenv').config();
const app = require('../app');
const connectDB = require('../config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection failed', err);
    return res.status(500).json({ message: 'Database unavailable' });
  }
  return app(req, res);
};
