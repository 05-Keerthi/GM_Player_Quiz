const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  surveyQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveyQuiz' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  surveySessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveySession' },
  totalQuestions: { type: Number },
  surveyTotalQuestions: { type: Number },
  correctAnswers: { type: Number },
  incorrectAnswers: { type: Number },
  totalScore: { type: Number },
  completedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Report', reportSchema);
