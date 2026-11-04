const mongoose = require('mongoose');

const assessmentAttemptSchema = new mongoose.Schema(
  {
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUBMITTED'],
      default: 'IN_PROGRESS',
    },
    score: { type: Number, default: null },
    percentage: { type: Number, default: null },
    passed: { type: Boolean, default: null },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    // Stores student's MCQ answers: { questionId, selectedOption, isCorrect }
    answers: { type: mongoose.Schema.Types.Mixed, default: [] },
  },
  { timestamps: false }
);

module.exports = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
