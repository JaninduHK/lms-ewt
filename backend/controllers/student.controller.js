const mongoose = require('mongoose');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const { Parser } = require('json2csv');

// Build aggregation pipeline for filtered students with their enrollments joined.
const buildPipeline = (q) => {
  const { search, classId, district, school, course, status } = q;
  const match = { role: 'student' };
  if (district && district !== 'all') match.district = district;
  if (course && course !== 'all') match.course = course;
  if (school) match.school = { $regex: school, $options: 'i' };
  if (search) {
    match.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { username: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { whatsapp: { $regex: search, $options: 'i' } },
    ];
  }

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'enrollments',
        localField: '_id',
        foreignField: 'studentId',
        as: 'enrollments',
      },
    },
    {
      $lookup: {
        from: 'classes',
        localField: 'enrollments.classId',
        foreignField: '_id',
        as: 'enrolledClasses',
      },
    },
  ];

  if (classId && classId !== 'all') {
    pipeline.push({
      $match: { 'enrollments.classId': new mongoose.Types.ObjectId(classId) },
    });
  }

  if (status && status !== 'all') {
    pipeline.push({
      $match: { 'enrollments.status': status },
    });
  }

  pipeline.push({
    $project: {
      password: 0, refreshTokens: 0,
    },
  });

  return pipeline;
};

const list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const pipeline = buildPipeline(req.query);

    const [items, totalArr] = await Promise.all([
      User.aggregate([
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      User.aggregate([...pipeline, { $count: 'total' }]),
    ]);

    const total = totalArr[0]?.total || 0;
    res.json({
      students: items,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

const detail = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id).select('-password -refreshTokens');
    if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });
    const [enrollments, payments] = await Promise.all([
      Enrollment.find({ studentId: student._id }).populate('classId'),
      Payment.find({ studentId: student._id }).populate('classId', 'title type').sort('-createdAt'),
    ]);
    res.json({ student, enrollments, payments });
  } catch (err) { next(err); }
};

const exportCSV = async (req, res, next) => {
  try {
    const pipeline = buildPipeline(req.query);
    const items = await User.aggregate([...pipeline, { $sort: { createdAt: -1 } }]);
    const rows = items.map(s => ({
      StudentID: s.studentId || '',
      FirstName: s.firstName,
      LastName: s.lastName,
      Username: s.username,
      Email: s.email,
      Course: s.course || '',
      School: s.school || '',
      District: s.district || '',
      WhatsApp: s.whatsapp || '',
      EnrolledClasses: (s.enrolledClasses || []).map(c => c.title).join('; '),
      JoinedDate: s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : '',
    }));
    const parser = new Parser();
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment(`students-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) { next(err); }
};

module.exports = { list, detail, exportCSV };
