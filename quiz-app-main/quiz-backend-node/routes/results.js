const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const QuizAttempt = require('../models/QuizAttempt');
const StudentAnswer = require('../models/StudentAnswer');
const Question = require('../models/Question');

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.use(authMiddleware);

// ── GET /student/results/:attemptId ──────────────────────────────────────────
router.get('/results/:attemptId', asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.attemptId)
    .populate('quiz')
    .populate('student', 'name email');

  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

  const answers = await StudentAnswer.find({ attempt: attempt._id }).populate('question');

  const questionResults = answers.map((a) => ({
    questionId: a.question?._id,
    questionText: a.question?.questionText,
    selectedOption: a.selectedOption,
    correctAnswer: a.question?.correctAnswer,
    isCorrect: a.isCorrect,
    marks: a.question?.marks || 1,
  }));

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalQuestions = await Question.countDocuments({ quiz: attempt.quiz._id });

  res.json({
    success: true,
    data: {
      attemptId: attempt._id,
      quizTitle: attempt.quiz?.title,
      score: attempt.score,
      totalMarks: attempt.quiz?.totalMarks,
      correctAnswers: correctCount,
      totalQuestions,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      studentName: attempt.student?.name,
      studentEmail: attempt.student?.email,
      questions: questionResults,
    },
  });
}));

module.exports = router;
