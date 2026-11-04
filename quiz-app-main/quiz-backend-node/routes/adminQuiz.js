const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');
const StudentAnswer = require('../models/StudentAnswer');
const CodingTest = require('../models/CodingTest');

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.use(authMiddleware);

// Helper to map quiz to response
const mapQuiz = (quiz) => ({
  id: quiz._id,
  title: quiz.title,
  description: quiz.description,
  durationMinutes: quiz.durationMinutes,
  totalMarks: quiz.totalMarks,
  active: quiz.active,
  scheduledFor: quiz.scheduledFor,
  validUntil: quiz.validUntil,
  createdAt: quiz.createdAt,
  createdBy: quiz.createdBy,
});

// ── GET /admin/quizzes ────────────────────────────────────────────────────────
router.get('/quizzes', requireAdmin, asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ createdBy: req.currentUser._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: quizzes.map(mapQuiz) });
}));

// ── GET /admin/quizzes/:id ────────────────────────────────────────────────────
router.get('/quizzes/:id', requireAdmin, asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

  // Include question count and coding tests for detail view
  const questionCount = await Question.countDocuments({ quiz: quiz._id });
  const codingTests = await CodingTest.find({ quiz: quiz._id });

  res.json({
    success: true,
    data: {
      ...mapQuiz(quiz),
      questionCount,
      codingTests: codingTests.map((ct) => ({
        id: ct._id,
        title: ct.title,
        difficulty: ct.difficulty,
      })),
    },
  });
}));

// ── POST /admin/quizzes ───────────────────────────────────────────────────────
router.post('/quizzes', requireAdmin, asyncHandler(async (req, res) => {
  const { title, description, durationMinutes, totalMarks, active, scheduledFor, validUntil } = req.body;
  if (!title || !durationMinutes || !totalMarks) {
    return res.status(400).json({ success: false, message: 'title, durationMinutes, totalMarks are required' });
  }

  const quiz = await Quiz.create({
    title,
    description,
    durationMinutes,
    totalMarks,
    active: active !== undefined ? active : true,
    scheduledFor,
    validUntil,
    createdBy: req.currentUser._id,
  });

  res.status(201).json({ success: true, message: 'Quiz created', data: mapQuiz(quiz) });
}));

// ── PUT /admin/quizzes/:id ────────────────────────────────────────────────────
router.put('/quizzes/:id', requireAdmin, asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

  const fields = ['title', 'description', 'durationMinutes', 'totalMarks', 'active', 'scheduledFor', 'validUntil'];
  fields.forEach((f) => { if (req.body[f] !== undefined) quiz[f] = req.body[f]; });
  await quiz.save();

  res.json({ success: true, message: 'Quiz updated', data: mapQuiz(quiz) });
}));

// ── DELETE /admin/quizzes/:id ─────────────────────────────────────────────────
router.delete('/quizzes/:id', requireAdmin, asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

  // Cascade delete
  const attempts = await QuizAttempt.find({ quiz: quiz._id });
  const attemptIds = attempts.map((a) => a._id);

  await StudentAnswer.deleteMany({ attempt: { $in: attemptIds } });
  await QuizAttempt.deleteMany({ quiz: quiz._id });
  await Question.deleteMany({ quiz: quiz._id });
  await Quiz.findByIdAndDelete(quiz._id);

  res.json({ success: true, message: 'Quiz deleted' });
}));

// ── GET /admin/quizzes/:id/results ────────────────────────────────────────────
router.get('/quizzes/:id/results', requireAdmin, asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({ quiz: req.params.id })
    .populate('student', 'name email phone')
    .populate('quiz', 'title totalMarks');

  const results = await Promise.all(
    attempts.map(async (a) => {
      const answers = await StudentAnswer.find({ attempt: a._id });
      const correctCount = answers.filter((ans) => ans.isCorrect).length;
      const totalQ = await Question.countDocuments({ quiz: a.quiz._id });
      return {
        attemptId: a._id,
        studentName: a.student?.name,
        studentEmail: a.student?.email,
        studentPhone: a.student?.phone,
        quizId: a.quiz?._id,
        quizTitle: a.quiz?.title,
        score: a.score,
        totalMarks: a.quiz?.totalMarks,
        correctAnswers: correctCount,
        totalQuestions: totalQ,
        status: a.status,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
      };
    })
  );

  res.json({ success: true, data: results });
}));

module.exports = router;
