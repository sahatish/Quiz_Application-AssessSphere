const Otp = require('../models/Otp');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('./emailService');

/**
 * Generate a 6-digit OTP, store it, and email it to the user.
 */
const generateAndSendOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw Object.assign(new Error('No account found with email: ' + email), { statusCode: 404 });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete any existing OTPs for this email
  await Otp.deleteMany({ email });

  await Otp.create({ email, otp, expiresAt });

  await sendEmail({
    to: email,
    subject: 'AssessSphere — Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}\n\nThis code expires in 10 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border-radius:12px;background:#0f172a;color:#e2e8f0">
        <h2 style="color:#4cd7f6">AssessSphere Password Reset</h2>
        <p>Use the OTP below to reset your password. It expires in <b>10 minutes</b>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#1e293b;border-radius:8px;color:#4cd7f6">${otp}</div>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px">If you did not request this, ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Verify the OTP and reset the user's password.
 */
const verifyOtpAndResetPassword = async (email, otp, newPassword) => {
  const record = await Otp.findOne({ email, used: false }).sort({ expiresAt: -1 });

  if (!record) {
    throw Object.assign(new Error('No pending OTP found for this email'), { statusCode: 400 });
  }

  if (record.otp !== otp) {
    throw Object.assign(new Error('Invalid OTP'), { statusCode: 400 });
  }

  if (record.expiresAt < new Date()) {
    throw Object.assign(new Error('OTP has expired'), { statusCode: 400 });
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save({ validateBeforeSave: false }); // skip mongoose pre-save re-hash (already hashed)

  // Actually, since the pre-save hook re-hashes, we need to set it directly:
  await User.updateOne({ email }, { password: await bcrypt.hash(newPassword, 10) });

  record.used = true;
  await record.save();
  await Otp.deleteMany({ email });
};

module.exports = { generateAndSendOtp, verifyOtpAndResetPassword };
