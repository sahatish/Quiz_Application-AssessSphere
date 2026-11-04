const mongoose = require('mongoose');

// Stores OTP for password reset
const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Otp', otpSchema);
