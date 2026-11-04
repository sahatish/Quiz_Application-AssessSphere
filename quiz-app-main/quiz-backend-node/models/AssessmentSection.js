const mongoose = require('mongoose');

// Mirrors AssessmentSection.java — one quiz or coding section per row
const assessmentSectionSchema = new mongoose.Schema(
  {
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    sectionType: { type: String, enum: ['QUIZ', 'CODING'], required: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null }, // quiz or codingTest id
    sectionOrder: { type: Number, default: 0 },
  },
  { timestamps: false }
);

module.exports = mongoose.model('AssessmentSection', assessmentSectionSchema);
