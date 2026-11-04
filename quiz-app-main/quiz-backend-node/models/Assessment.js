const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: null },
    durationMinutes: { type: Number, default: null },
    shareToken: { type: String, unique: true, default: null },
    active: { type: Boolean, default: true },
    scheduledFor: { type: Date, default: null },
    validUntil: { type: Date, default: null },
    passingPercentage: { type: Number, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Assessment', assessmentSchema);
