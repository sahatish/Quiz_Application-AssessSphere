const mongoose = require('mongoose');

const studentAnswerSchema = new mongoose.Schema(
  {
    attempt: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizAttempt', required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOption: { type: String, default: null },
    isCorrect: { type: Boolean, default: false },
  },
  { timestamps: false }
);

module.exports = mongoose.model('StudentAnswer', studentAnswerSchema);
