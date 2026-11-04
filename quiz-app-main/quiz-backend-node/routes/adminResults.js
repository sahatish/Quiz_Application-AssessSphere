const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const Assessment = require('../models/Assessment');

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.use(authMiddleware);

// ── GET /admin/results ────────────────────────────────────────────────────────
router.get('/results', requireAdmin, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const size = parseInt(req.query.size) || 10;
  const adminId = req.currentUser._id;

  // Get admin's assessment IDs
  const adminAssessmentIds = await Assessment.find({ createdBy: adminId }).distinct('_id');

  const total = await AssessmentAttempt.countDocuments({ assessment: { $in: adminAssessmentIds } });
  const attempts = await AssessmentAttempt.find({ assessment: { $in: adminAssessmentIds } })
    .populate('assessment', 'title')
    .populate('student', 'name email phone')
    .sort({ submittedAt: -1 })
    .skip(page * size)
    .limit(size);

  const results = attempts.map((a) => ({
    attemptId: a._id,
    studentName: a.student?.name,
    studentEmail: a.student?.email,
    studentPhone: a.student?.phone,
    quizId: a.assessment?._id,
    quizTitle: a.assessment?.title,
    score: a.score || 0,
    totalMarks: null,
    percentage: a.percentage,
    passed: a.passed,
    status: a.status,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
  }));

  res.json({
    success: true,
    data: {
      content: results,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      number: page,
      size,
    },
  });
}));

module.exports = router;
