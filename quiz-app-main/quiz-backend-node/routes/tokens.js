const express = require('express');
const router = express.Router();
const ExamToken = require('../models/ExamToken');

const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ── GET /tokens/verify ────────────────────────────────────────────────────────
router.get('/verify', asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ success: false, message: 'token param required' });

  const examToken = await ExamToken.findOne({ token })
    .populate('student', 'name email phone role');

  if (!examToken) {
    return res.status(404).json({ success: false, message: 'Token not found or invalid' });
  }

  if (examToken.used) {
    return res.status(400).json({ success: false, message: 'Token already used' });
  }

  if (examToken.expiresAt && examToken.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: 'Token has expired' });
  }

  res.json({
    success: true,
    data: {
      token: examToken.token,
      examType: examToken.examType,
      examId: examToken.examId,
      used: examToken.used,
      student: {
        id: examToken.student?._id,
        name: examToken.student?.name,
        email: examToken.student?.email,
        phone: examToken.student?.phone,
        role: examToken.student?.role,
      },
    },
  });
}));

// ── POST /tokens/consume ──────────────────────────────────────────────────────
router.post('/consume', asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ success: false, message: 'token param required' });

  const examToken = await ExamToken.findOne({ token });
  if (!examToken) return res.status(404).json({ success: false, message: 'Token not found' });

  if (examToken.used) {
    return res.status(400).json({ success: false, message: 'Token already used' });
  }

  examToken.used = true;
  examToken.usedAt = new Date();
  await examToken.save();

  res.json({ success: true, message: 'Token consumed', data: { token: examToken.token, usedAt: examToken.usedAt } });
}));

module.exports = router;
