const mongoose = require('mongoose');

const studentCodingSubmissionSchema = new mongoose.Schema(
  {
    attempt: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizAttempt', default: null },
    assessmentAttempt: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentAttempt', default: null },
    codingTest: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingTest', required: true },
    code: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    passed: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('StudentCodingSubmission', studentCodingSubmissionSchema);
