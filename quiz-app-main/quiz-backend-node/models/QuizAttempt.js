const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUBMITTED'],
      default: 'IN_PROGRESS',
    },
    score: { type: Number, default: null },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    // Link to parent AssessmentAttempt when quiz is part of an assessment
    assessmentAttempt: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentAttempt', default: null },
  },
  { timestamps: false }
);

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
