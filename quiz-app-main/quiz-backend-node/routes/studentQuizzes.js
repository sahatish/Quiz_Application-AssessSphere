const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');
const StudentAnswer = require('../models/StudentAnswer');
const StudentCodingSubmission = require('../models/StudentCodingSubmission');
const CodingTest = require('../models/CodingTest');

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.use(authMiddleware);

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
});

// ── GET /student/quizzes ──────────────────────────────────────────────────────
router.get('/quizzes', asyncHandler(async (req, res) => {
  let filter = { active: true };
  if (req.currentUser?.createdBy) {
    filter.createdBy = req.currentUser.createdBy;
  }
  const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: quizzes.map(mapQuiz) });
}));

// ── GET /student/quizzes/:id ──────────────────────────────────────────────────
router.get('/quizzes/:id', asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
  res.json({ success: true, data: mapQuiz(quiz) });
}));

// ── GET /student/quizzes/:id/assessment ──────────────────────────────────────
router.get('/quizzes/:id/assessment', asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
  res.json({
    success: true,
    data: {
      id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      durationMinutes: quiz.durationMinutes,
      active: quiz.active,
    },
  });
}));

// ── POST /student/quizzes/start/:quizId ──────────────────────────────────────
router.post('/quizzes/start/:quizId', asyncHandler(async (req, res) => {
  const { studentId } = req.query;
  if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required' });

  const quiz = await Quiz.findById(req.params.quizId);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

  // Check for existing IN_PROGRESS attempt
  const existing = await QuizAttempt.findOne({
    student: studentId,
    quiz: quiz._id,
    status: 'IN_PROGRESS',
  });
  if (existing) {
    return res.json({
      success: true,
      data: {
        attemptId: existing._id,
        quizId: quiz._id,
        quizTitle: quiz.title,
        status: existing.status,
        startedAt: existing.startedAt,
        submittedAt: existing.submittedAt,
      },
    });
  }

  // Enforce max 2 completed attempts
  const completedCount = await QuizAttempt.countDocuments({
    student: studentId,
    quiz: quiz._id,
    status: 'SUBMITTED',
  });
  if (completedCount >= 2) {
    return res.status(400).json({
      success: false,
      message: 'ATTEMPT_LIMIT_REACHED: You have used all 2 attempts for this quiz.',
    });
  }

  const attempt = await QuizAttempt.create({ student: studentId, quiz: quiz._id });

  res.status(201).json({
    success: true,
    data: {
      attemptId: attempt._id,
      quizId: quiz._id,
      quizTitle: quiz.title,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
    },
  });
}));

// ── POST /student/quizzes/submit-answer ───────────────────────────────────────
router.post('/quizzes/submit-answer', asyncHandler(async (req, res) => {
  const { attemptId, questionId, selectedOption } = req.body;

  const attempt = await QuizAttempt.findById(attemptId).populate('quiz');
  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
  if (attempt.status !== 'IN_PROGRESS') {
    return res.status(400).json({ success: false, message: 'This attempt is already submitted.' });
  }

  const question = await Question.findById(questionId);
  if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
  if (question.quiz.toString() !== attempt.quiz._id.toString()) {
    return res.status(400).json({ success: false, message: 'Question does not belong to this quiz.' });
  }

  // Determine correctness (supports multi-answer: "A,B")
  let isCorrect = false;
  if (question.correctAnswer && selectedOption && selectedOption.trim()) {
    const correctSet = new Set(question.correctAnswer.split(',').map((s) => s.trim().toUpperCase()));
    const selectedSet = new Set(
      selectedOption.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    );
    isCorrect = correctSet.size === selectedSet.size &&
      [...correctSet].every((c) => selectedSet.has(c));
  }

  // Upsert answer
  await StudentAnswer.findOneAndUpdate(
    { attempt: attemptId, question: questionId },
    { selectedOption, isCorrect },
    { upsert: true, new: true }
  );

  res.json({ success: true, message: 'Answer saved' });
}));

// ── POST /student/quizzes/submit-coding ──────────────────────────────────────
router.post('/quizzes/submit-coding', asyncHandler(async (req, res) => {
  const { attemptId, codingTestId, code, language, passed } = req.body;

  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
  if (attempt.status !== 'IN_PROGRESS') {
    return res.status(400).json({ success: false, message: 'Attempt already submitted.' });
  }

  const codingTest = await CodingTest.findById(codingTestId);
  if (!codingTest) return res.status(404).json({ success: false, message: 'Coding test not found' });

  await StudentCodingSubmission.findOneAndUpdate(
    { attempt: attemptId, codingTest: codingTestId },
    { code, language, passed: !!passed },
    { upsert: true, new: true }
  );

  res.json({ success: true, message: 'Coding submission saved' });
}));

// ── POST /student/quizzes/submit/:attemptId ───────────────────────────────────
router.post('/quizzes/submit/:attemptId', asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.attemptId).populate('quiz');
  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
  if (attempt.status === 'SUBMITTED') {
    return res.status(400).json({ success: false, message: 'Attempt already submitted.' });
  }

  const answers = await StudentAnswer.find({ attempt: attempt._id }).populate('question');
  const rawScore = answers
    .filter((a) => a.isCorrect)
    .reduce((sum, a) => sum + (a.question?.marks || 1), 0);

  const totalMarks = attempt.quiz?.totalMarks || rawScore;
  const score = totalMarks > 0 ? Math.min(rawScore, totalMarks) : rawScore;

  attempt.status = 'SUBMITTED';
  attempt.score = score;
  attempt.submittedAt = new Date();
  await attempt.save();

  res.json({
    success: true,
    data: {
      attemptId: attempt._id,
      quizId: attempt.quiz._id,
      quizTitle: attempt.quiz.title,
      status: attempt.status,
      score,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
    },
  });
}));

module.exports = router;
