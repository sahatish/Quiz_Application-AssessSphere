const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const ExamToken = require('../models/ExamToken');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.use(authMiddleware);

const mapToken = (t) => ({
  id: t._id,
  token: t.token,
  examType: t.examType,
  examId: t.examId,
  student: t.student,
  used: t.used,
  usedAt: t.usedAt,
  createdAt: t.createdAt,
  expiresAt: t.expiresAt,
});

// ── POST /admin/tokens/generate ───────────────────────────────────────────────
router.post('/tokens/generate', requireAdmin, asyncHandler(async (req, res) => {
  const { examType, examId, studentIds, expiresAt } = req.body;
  if (!examType || !examId || !studentIds || !Array.isArray(studentIds)) {
    return res.status(400).json({ success: false, message: 'examType, examId, and studentIds[] are required' });
  }

  const tokens = [];
  for (const studentId of studentIds) {
    const student = await User.findById(studentId);
    if (!student) continue;

    const token = uuidv4();
    const examToken = await ExamToken.create({
      token,
      examType: examType.toUpperCase(),
      examId,
      student: studentId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    tokens.push(mapToken(examToken));
  }

  res.status(201).json({ success: true, message: `${tokens.length} tokens generated`, data: tokens });
}));

// ── GET /admin/tokens/exam/:type/:id ──────────────────────────────────────────
router.get('/tokens/exam/:type/:id', requireAdmin, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const size = parseInt(req.query.size) || 20;

  const filter = {
    examType: req.params.type.toUpperCase(),
    examId: req.params.id,
  };

  const total = await ExamToken.countDocuments(filter);
  const tokens = await ExamToken.find(filter)
    .populate('student', 'name email phone')
    .skip(page * size)
    .limit(size)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      content: tokens.map(mapToken),
      totalElements: total,
      totalPages: Math.ceil(total / size),
      number: page,
      size,
    },
  });
}));

// ── POST /admin/tokens/exam/:type/:id/email-all ───────────────────────────────
router.post('/tokens/exam/:type/:id/email-all', requireAdmin, asyncHandler(async (req, res) => {
  const baseUrl = req.query.baseUrl || 'https://assesssphere.com';
  const tokens = await ExamToken.find({
    examType: req.params.type.toUpperCase(),
    examId: req.params.id,
  }).populate('student', 'name email');

  let sent = 0;
  for (const t of tokens) {
    if (!t.student?.email) continue;
    const link = `${baseUrl}/exam/entry/${t.token}`;
    try {
      await sendEmail({
        to: t.student.email,
        subject: 'Your Private Exam Link — AssessSphere',
        text: `Hello ${t.student.name},\n\nHere is your private exam link:\n${link}\n\nGood luck!`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px">
            <h2 style="color:#4cd7f6">Your Private Exam Link</h2>
            <p>Hello <b>${t.student.name}</b>,</p>
            <p>Click the button below to access your exam:</p>
            <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Start Exam</a>
            <p style="color:#94a3b8;font-size:12px;margin-top:16px">This link is private. Do not share it.</p>
          </div>
        `,
      });
      sent++;
    } catch (err) {
      console.error('Failed to send email to', t.student.email, err.message);
    }
  }

  res.json({ success: true, message: `Emails sent to ${sent} students` });
}));

module.exports = router;
