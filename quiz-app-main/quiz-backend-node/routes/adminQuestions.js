const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const Question = require('../models/Question');
const Quiz = require('../models/Quiz');

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
  correctAnswer: q.correctAnswer,
  marks: q.marks,
  quizId: q.quiz,
});

// ── GET /admin/questions/quiz/:quizId ─────────────────────────────────────────
router.get('/questions/quiz/:quizId', requireAdmin, asyncHandler(async (req, res) => {
  const questions = await Question.find({ quiz: req.params.quizId });
  res.json({ success: true, data: questions.map(mapQuestion) });
}));

// ── POST /admin/questions ─────────────────────────────────────────────────────
router.post('/questions', requireAdmin, asyncHandler(async (req, res) => {
  const { questionText, questionImage, optionA, optionB, optionC, optionD, correctAnswer, marks, quizId } = req.body;
  if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !quizId) {
    return res.status(400).json({ success: false, message: 'All question fields and quizId are required' });
  }

  const quiz = await Quiz.findById(quizId);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

  const question = await Question.create({
    questionText, questionImage, optionA, optionB, optionC, optionD,
    correctAnswer, marks: marks || 1, quiz: quizId,
  });

  res.status(201).json({ success: true, message: 'Question added', data: mapQuestion(question) });
}));

// ── POST /admin/questions/bulk ────────────────────────────────────────────────
router.post('/questions/bulk', requireAdmin, asyncHandler(async (req, res) => {
  const { quizId } = req.query;
  const questions = req.body; // array of question objects

  if (!quizId) return res.status(400).json({ success: false, message: 'quizId query param required' });
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ success: false, message: 'Array of questions required' });
  }

  const quiz = await Quiz.findById(quizId);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

  const docs = questions.map((q) => ({ ...q, quiz: quizId }));
  const created = await Question.insertMany(docs);

  res.status(201).json({ success: true, message: `${created.length} questions added`, data: created.map(mapQuestion) });
}));

// ── PUT /admin/questions/:id ──────────────────────────────────────────────────
router.put('/questions/:id', requireAdmin, asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

  const fields = ['questionText', 'questionImage', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'marks'];
  fields.forEach((f) => { if (req.body[f] !== undefined) question[f] = req.body[f]; });
  await question.save();

  res.json({ success: true, message: 'Question updated', data: mapQuestion(question) });
}));

// ── DELETE /admin/questions/:id ───────────────────────────────────────────────
router.delete('/questions/:id', requireAdmin, asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndDelete(req.params.id);
  if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
  res.json({ success: true, message: 'Question deleted' });
}));

module.exports = router;
