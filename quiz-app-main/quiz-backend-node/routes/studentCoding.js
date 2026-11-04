const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const CodingTest = require('../models/CodingTest');
const { executeCode, runTestCases } = require('../services/compilerService');

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.use(authMiddleware);

const mapCodingTest = (ct, hideTestCases = false) => ({
  id: ct._id,
  title: ct.title,
  description: ct.description,
  sampleInput: ct.sampleInput,
  sampleOutput: ct.sampleOutput,
  difficulty: ct.difficulty,
  testCases: hideTestCases
    ? ct.testCases.map((tc) => ({ input: tc.input })) // Hide expected output from students
    : ct.testCases,
  scheduledFor: ct.scheduledFor,
  validUntil: ct.validUntil,
});

// ── GET /student/coding-tests ─────────────────────────────────────────────────
router.get('/coding-tests', asyncHandler(async (req, res) => {
  let filter = {};
  if (req.currentUser?.createdBy) {
    filter.createdBy = req.currentUser.createdBy;
  }
  const tests = await CodingTest.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: tests.map((ct) => mapCodingTest(ct, true)) });
}));

// ── GET /student/coding-tests/:id ─────────────────────────────────────────────
router.get('/coding-tests/:id', asyncHandler(async (req, res) => {
  const test = await CodingTest.findById(req.params.id);
  if (!test) return res.status(404).json({ success: false, message: 'Coding test not found' });
  res.json({ success: true, data: mapCodingTest(test, true) });
}));

// ── POST /student/code/run ────────────────────────────────────────────────────
router.post('/code/run', asyncHandler(async (req, res) => {
  const { code, language, input } = req.body;
  if (!code || !language) {
    return res.status(400).json({ success: false, message: 'code and language are required' });
  }

  const output = await executeCode(code, language, input || '');
  res.json({ success: true, data: { output } });
}));

// ── POST /student/code/submit ─────────────────────────────────────────────────
router.post('/code/submit', asyncHandler(async (req, res) => {
  const { codingTestId, code, language } = req.body;
  if (!codingTestId || !code || !language) {
    return res.status(400).json({ success: false, message: 'codingTestId, code, and language are required' });
  }

  const codingTest = await CodingTest.findById(codingTestId);
  if (!codingTest) return res.status(404).json({ success: false, message: 'Coding test not found' });

  const results = await runTestCases(code, language, codingTest.testCases);
  const allPassed = results.every((r) => r.passed);
  const passedCount = results.filter((r) => r.passed).length;

  res.json({
    success: true,
    data: {
      results,
      allPassed,
      passedCount,
      totalTests: results.length,
    },
  });
}));

module.exports = router;
