const express = require('express');
const router = express.Router();
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const CodingTest = require('../models/CodingTest');
const { executeCode, runTestCases } = require('../services/compilerService');
const axios = require('axios');

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.use(authMiddleware);

const mapCodingTest = (ct) => ({
  id: ct._id,
  title: ct.title,
  description: ct.description,
  sampleInput: ct.sampleInput,
  sampleOutput: ct.sampleOutput,
  difficulty: ct.difficulty,
  testCases: ct.testCases,
  scheduledFor: ct.scheduledFor,
  validUntil: ct.validUntil,
  createdAt: ct.createdAt,
  quizId: ct.quiz,
});

// ── GET /admin/coding-tests ───────────────────────────────────────────────────
router.get('/coding-tests', requireAdmin, asyncHandler(async (req, res) => {
  const tests = await CodingTest.find({ createdBy: req.currentUser._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: tests.map(mapCodingTest) });
}));

// ── GET /admin/coding-tests/:id ───────────────────────────────────────────────
router.get('/coding-tests/:id', requireAdmin, asyncHandler(async (req, res) => {
  const test = await CodingTest.findById(req.params.id);
  if (!test) return res.status(404).json({ success: false, message: 'Coding test not found' });
  res.json({ success: true, data: mapCodingTest(test) });
}));

// ── POST /admin/coding-tests ──────────────────────────────────────────────────
router.post('/coding-tests', requireAdmin, asyncHandler(async (req, res) => {
  const { title, description, sampleInput, sampleOutput, difficulty, testCases, scheduledFor, validUntil, quizId } = req.body;
  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'title and description are required' });
  }

  const test = await CodingTest.create({
    title, description, sampleInput, sampleOutput,
    difficulty: difficulty || 'MEDIUM',
    testCases: testCases || [],
    scheduledFor, validUntil,
    createdBy: req.currentUser._id,
    quiz: quizId || null,
  });

  res.status(201).json({ success: true, message: 'Coding test created', data: mapCodingTest(test) });
}));

// ── PUT /admin/coding-tests/:id ───────────────────────────────────────────────
router.put('/coding-tests/:id', requireAdmin, asyncHandler(async (req, res) => {
  const test = await CodingTest.findById(req.params.id);
  if (!test) return res.status(404).json({ success: false, message: 'Coding test not found' });

  const fields = ['title', 'description', 'sampleInput', 'sampleOutput', 'difficulty', 'testCases', 'scheduledFor', 'validUntil'];
  fields.forEach((f) => { if (req.body[f] !== undefined) test[f] = req.body[f]; });
  if (req.body.quizId !== undefined) test.quiz = req.body.quizId;
  await test.save();

  res.json({ success: true, message: 'Coding test updated', data: mapCodingTest(test) });
}));

// ── DELETE /admin/coding-tests/:id ───────────────────────────────────────────
router.delete('/coding-tests/:id', requireAdmin, asyncHandler(async (req, res) => {
  const test = await CodingTest.findByIdAndDelete(req.params.id);
  if (!test) return res.status(404).json({ success: false, message: 'Coding test not found' });
  res.json({ success: true, message: 'Coding test deleted' });
}));

// ── GET /admin/coding-tests/import-leetcode ───────────────────────────────────
// Proxy to LeetCode GraphQL to import problem by slug
router.get('/coding-tests/import-leetcode', requireAdmin, asyncHandler(async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ success: false, message: 'query param required' });

  try {
    const response = await axios.post(
      'https://leetcode.com/graphql',
      {
        query: `query {
          question(titleSlug: "${query}") {
            title
            content
            difficulty
            sampleTestCase
            exampleTestcases
          }
        }`,
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const q = response.data?.data?.question;
    if (!q) return res.status(404).json({ success: false, message: 'Problem not found on LeetCode' });

    res.json({
      success: true,
      data: {
        title: q.title,
        description: q.content?.replace(/<[^>]*>/g, '') || q.title,
        difficulty: (q.difficulty || 'MEDIUM').toUpperCase(),
        sampleInput: q.sampleTestCase || '',
        sampleOutput: '',
        testCases: [],
      },
    });
  } catch (err) {
    res.status(502).json({ success: false, message: 'Failed to fetch from LeetCode: ' + err.message });
  }
}));

module.exports = router;
