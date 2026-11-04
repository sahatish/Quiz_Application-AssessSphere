const mongoose = require('mongoose');

const examTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    examType: { type: String, enum: ['QUIZ', 'CODING', 'ASSESSMENT'], required: true },
    examId: { type: mongoose.Schema.Types.ObjectId, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: false }
);

module.exports = mongoose.model('ExamToken', examTokenSchema);
