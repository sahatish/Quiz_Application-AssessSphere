const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    durationMinutes: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    active: { type: Boolean, default: true },
    scheduledFor: { type: Date, default: null },
    validUntil: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('Quiz', quizSchema);
