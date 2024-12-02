const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  answerType: { type: String, enum: ['option', 'text', 'boolean'], required: true },
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
  isCorrect: { type: Boolean, default: false },
  timeTaken: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Answer', answerSchema);
