const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Question = require('../models/Question');

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.use(authMiddleware);

const mapQuestion = (q) => ({
  id: q._id,
  questionText: q.questionText,
  questionImage: q.questionImage,
  optionA: q.optionA,
  optionB: q.optionB,
  optionC: q.optionC,
  optionD: q.optionD,
  // Don't expose correctAnswer to students
  marks: q.marks,
  quizId: q.quiz,
});

// ── GET /questions/quiz/:quizId — for students (no correct answers) ────────────
router.get('/quiz/:quizId', asyncHandler(async (req, res) => {
  const questions = await Question.find({ quiz: req.params.quizId });
  res.json({ success: true, data: questions.map(mapQuestion) });
}));

module.exports = router;
