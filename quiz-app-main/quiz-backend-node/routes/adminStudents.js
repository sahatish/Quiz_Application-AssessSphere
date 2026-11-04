const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const AssessmentAttempt = require('../models/AssessmentAttempt');

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.use(authMiddleware);

// ── GET /admin/students ───────────────────────────────────────────────────────
router.get('/students', requireAdmin, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const size = parseInt(req.query.size) || 10;
  const search = req.query.search?.trim() || '';
  const adminId = req.currentUser._id;

  const filter = { role: 'STUDENT', createdBy: adminId };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await User.countDocuments(filter);
  const students = await User.find(filter)
    .skip(page * size)
    .limit(size)
    .sort({ createdAt: -1 })
    .select('-password');

  res.json({
    success: true,
    data: {
      content: students.map((s) => ({
        id: s._id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        role: s.role,
        createdAt: s.createdAt,
      })),
      totalElements: total,
      totalPages: Math.ceil(total / size),
      number: page,
      size,
    },
  });
}));

// ── DELETE /admin/students/:id ────────────────────────────────────────────────
router.delete('/students/:id', requireAdmin, asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Student deleted' });
}));

// ── GET /admin/students/:id/results ──────────────────────────────────────────
router.get('/students/:id/results', requireAdmin, asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const attempts = await AssessmentAttempt.find({ student: req.params.id })
    .populate('assessment', 'title createdBy')
    .populate('student', 'name email phone');

  // Filter by admin
  const adminId = req.currentUser._id.toString();
  const filtered = attempts.filter(
    (a) => a.assessment?.createdBy?.toString() === adminId
  );

  const results = filtered.map((a) => ({
    attemptId: a._id,
    studentName: a.student?.name,
    studentEmail: a.student?.email,
    studentPhone: a.student?.phone,
    quizId: a.assessment?._id,
    quizTitle: a.assessment?.title,
    score: a.score || 0,
    totalMarks: null,
    percentage: a.percentage || 0,
    passed: a.passed,
    status: a.status,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
  }));

  res.json({ success: true, data: results });
}));

module.exports = router;
