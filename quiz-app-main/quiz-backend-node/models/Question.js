const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    questionImage: { type: String, default: null }, // Base64 string
    optionA: { type: String, required: true },
    optionB: { type: String, required: true },
    optionC: { type: String, required: true },
    optionD: { type: String, required: true },
    correctAnswer: { type: String, required: true }, // "A", "B", "C", "D" or comma-separated for multi
    marks: { type: Number, required: true, default: 1 },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Question', questionSchema);
