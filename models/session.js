const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinCode: { type: String, required: true },
  qrData: { type: String }, // QR code data for joining the session
  status: { type: String, enum: ['waiting', 'in_progress', 'completed'], default: 'waiting' },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  currentQuestion: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  startTime: { type: Date },
  endTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Session', sessionSchema);
