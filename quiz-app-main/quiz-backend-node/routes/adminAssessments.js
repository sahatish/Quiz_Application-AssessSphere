const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const Assessment = require('../models/Assessment');
const AssessmentSection = require('../models/AssessmentSection');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.use(authMiddleware);

const mapAssessment = async (a) => {
  const sections = await AssessmentSection.find({ assessment: a._id }).sort({ sectionOrder: 1 });
  return {
    id: a._id,
    title: a.title,
    description: a.description,
    durationMinutes: a.durationMinutes,
    shareToken: a.shareToken,
    active: a.active,
    scheduledFor: a.scheduledFor,
    validUntil: a.validUntil,
    passingPercentage: a.passingPercentage,
    createdAt: a.createdAt,
    sections: sections.map((s) => ({
      id: s._id,
      sectionType: s.sectionType,
      referenceId: s.referenceId,
      sectionOrder: s.sectionOrder,
    })),
  };
};

// ── GET /admin/assessments ────────────────────────────────────────────────────
router.get('/assessments', requireAdmin, asyncHandler(async (req, res) => {
  const assessments = await Assessment.find({ createdBy: req.currentUser._id }).sort({ createdAt: -1 });
  const data = await Promise.all(assessments.map(mapAssessment));
  res.json({ success: true, data });
}));

// ── GET /admin/assessments/:id ────────────────────────────────────────────────
router.get('/assessments/:id', requireAdmin, asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });
  res.json({ success: true, data: await mapAssessment(assessment) });
}));

// ── POST /admin/assessments ───────────────────────────────────────────────────
router.post('/assessments', requireAdmin, asyncHandler(async (req, res) => {
  const { title, description, durationMinutes, scheduledFor, validUntil, passingPercentage, sections } = req.body;
  if (!title) return res.status(400).json({ success: false, message: 'title is required' });

  const assessment = await Assessment.create({
    title, description, durationMinutes, scheduledFor, validUntil,
    passingPercentage, active: true,
    shareToken: uuidv4(),
    createdBy: req.currentUser._id,
  });

  if (sections && Array.isArray(sections)) {
    for (const sec of sections) {
      await AssessmentSection.create({
        assessment: assessment._id,
        sectionType: sec.type,
        referenceId: sec.referenceId,
        sectionOrder: sec.order || 0,
      });
    }
  }

  res.status(201).json({ success: true, message: 'Assessment created', data: await mapAssessment(assessment) });
}));

// ── PUT /admin/assessments/:id ────────────────────────────────────────────────
router.put('/assessments/:id', requireAdmin, asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

  const fields = ['title', 'description', 'durationMinutes', 'scheduledFor', 'validUntil', 'passingPercentage', 'active'];
  fields.forEach((f) => { if (req.body[f] !== undefined) assessment[f] = req.body[f]; });
  await assessment.save();

  // Replace sections if provided
  if (req.body.sections && Array.isArray(req.body.sections)) {
    await AssessmentSection.deleteMany({ assessment: assessment._id });
    for (const sec of req.body.sections) {
      await AssessmentSection.create({
        assessment: assessment._id,
        sectionType: sec.type,
        referenceId: sec.referenceId,
        sectionOrder: sec.order || 0,
      });
    }
  }

  res.json({ success: true, message: 'Assessment updated', data: await mapAssessment(assessment) });
}));

// ── DELETE /admin/assessments/:id ─────────────────────────────────────────────
router.delete('/assessments/:id', requireAdmin, asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

  await AssessmentSection.deleteMany({ assessment: assessment._id });
  await AssessmentAttempt.deleteMany({ assessment: assessment._id });
  await Assessment.findByIdAndDelete(assessment._id);

  res.json({ success: true, message: 'Assessment deleted' });
}));

// ── POST /admin/assessments/:id/share — regenerate share token ────────────────
router.post('/assessments/:id/share', requireAdmin, asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

  assessment.shareToken = uuidv4();
  await assessment.save();

  res.json({ success: true, message: 'Share token regenerated', data: await mapAssessment(assessment) });
}));

// ── GET /admin/assessments/:id/results ───────────────────────────────────────
router.get('/assessments/:id/results', requireAdmin, asyncHandler(async (req, res) => {
  const sections = await AssessmentSection.find({ assessment: req.params.id }).sort({ sectionOrder: 1 });

  // Calculate total marks
  let totalMarks = 0;
  for (const sec of sections) {
    if (sec.sectionType === 'QUIZ' && sec.referenceId) {
      const questions = await Question.find({ quiz: sec.referenceId });
      totalMarks += questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    } else if (sec.sectionType === 'CODING') {
      totalMarks += 20;
    }
  }

  const attempts = await AssessmentAttempt.find({ assessment: req.params.id, status: 'SUBMITTED' })
    .populate('student', 'name email');

  const results = attempts.map((a) => ({
    id: a._id,
    studentName: a.student?.name,
    studentEmail: a.student?.email,
    score: a.score || 0,
    totalMarks,
    percentage: a.percentage || 0,
    passed: a.passed || false,
    submittedAt: a.submittedAt,
    status: a.status,
  }));

  res.json({ success: true, data: results });
}));

module.exports = router;
