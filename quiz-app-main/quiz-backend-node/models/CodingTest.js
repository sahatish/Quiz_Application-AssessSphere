const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
  },
  { _id: false }
);

const codingTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    sampleInput: { type: String, default: null },
    sampleOutput: { type: String, default: null },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
    },
    testCases: { type: [testCaseSchema], default: [] },
    scheduledFor: { type: Date, default: null },
    validUntil: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('CodingTest', codingTestSchema);
