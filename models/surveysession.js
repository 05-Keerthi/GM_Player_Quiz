const mongoose = require('mongoose');

const SurveySessionSchema = new mongoose.Schema({
  surveyQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveyQuiz', required: true },
  surveyHost: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  surveyJoinCode: { type: String, required: true },
  surveyQrData: { type: String }, 
  surveyStatus: { type: String, enum: ['waiting', 'in_progress', 'completed'], default: 'waiting' },
  surveyPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  surveyQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SurveyQuestion' }],
  surveyCurrentQuestion: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveyQuestion' },
  startTime: { type: Date },
  endTime: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SurveySession', SurveySessionSchema);
