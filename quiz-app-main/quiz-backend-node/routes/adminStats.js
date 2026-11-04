const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');
const StudentAnswer = require('../models/StudentAnswer');
const Assessment = require('../models/Assessment');
const User = require('../models/User');

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// Apply auth middleware to all routes
router.use(authMiddleware);

// ── GET /admin/stats ──────────────────────────────────────────────────────────
router.get('/stats', requireAdmin, asyncHandler(async (req, res) => {
  const adminId = req.currentUser._id;

  const [totalQuizzes, totalAssessments, totalStudents, totalQuestions, totalAttempts] = await Promise.all([
    Quiz.countDocuments({ createdBy: adminId }),
    Assessment.countDocuments({ createdBy: adminId }),
    User.countDocuments({ role: 'STUDENT', createdBy: adminId }),
    Question.countDocuments({ quiz: { $in: await Quiz.find({ createdBy: adminId }).distinct('_id') } }),
    QuizAttempt.countDocuments({ quiz: { $in: await Quiz.find({ createdBy: adminId }).distinct('_id') } }),
  ]);

  res.json({
    success: true,
    message: 'Stats fetched',
    data: { totalQuizzes, totalAssessments, totalStudents, totalQuestions, totalAttempts },
  });
}));

module.exports = router;
