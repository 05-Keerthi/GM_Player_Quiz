const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['multiple_choice', 'multiple_select', 'true_false', 'open_ended', 'poll'], required: true },
  imageUrl: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: false },
  options: [
    {
      text: { type: String, required: true },
      color: { type: String, required: false, default: null },
      isCorrect: { type: Boolean, required: false, default: false }
    }
  ],
  correctAnswer: [{ type: String }],
  points: { type: Number, default: 10 },
  timer: { type: Number, default: 10 },
});

module.exports = mongoose.model('Question', questionSchema);
