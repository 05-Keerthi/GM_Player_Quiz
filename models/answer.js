const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: false },
  answerType: { type: String, enum: ['option', 'text', 'boolean'], required: false },
  answer: { type: mongoose.Schema.Types.Mixed, required: false },
  isCorrect: { type: Boolean, default: false },
  timeTaken: { type: Number, required: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Answer', answerSchema);
