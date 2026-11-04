const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateAndSendOtp, verifyOtpAndResetPassword } = require('../services/otpService');

// Helper: wrap async handlers
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// Helper: sign a JWT for a user
const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'assesssphere_jwt_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── POST /register ─────────────────────────────────────────────────────────────
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'name, email, and password are required' });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return res.status(400).json({ success: false, message: `Email already registered: ${email}` });
  }

  const userRole = role && role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT';

  const user = await User.create({ name, email: email.toLowerCase(), password, role: userRole, phone });

  const token = signToken(user);

  res.status(201).json({
    success: true,
    message: 'Registered successfully',
    data: { id: user._id, name: user.name, email: user.email, role: user.role, token },
  });
}));

// ── POST /login ────────────────────────────────────────────────────────────────
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ success: false, message: `No account found with email: ${email}` });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ success: false, message: 'Invalid password' });
  }

  const token = signToken(user);

  res.json({
    success: true,
    message: 'Login successful',
    data: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, token },
  });
}));

// ── POST /forgot-password/request ─────────────────────────────────────────────
router.post('/forgot-password/request', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'email is required' });
  await generateAndSendOtp(email);
  res.json({ success: true, message: 'Verification code sent to your email address', data: null });
}));

// ── POST /forgot-password/reset ───────────────────────────────────────────────
router.post('/forgot-password/reset', asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'email, otp, and newPassword are required' });
  }
  await verifyOtpAndResetPassword(email, otp, newPassword);
  res.json({ success: true, message: 'Password reset successfully', data: null });
}));

module.exports = router;
