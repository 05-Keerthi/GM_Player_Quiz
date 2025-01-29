const mongoose = require('mongoose');

const surveyAnswerSchema = new mongoose.Schema({
  surveyQuestion: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveyQuestion', required: true },
  surveyPlayers: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  surveySession: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveySession', required: true },
  surveyAnswer: { type: mongoose.Schema.Types.Mixed, required: false,  default: 'null'},
  timeTaken: { type: Number, required: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SurveyAnswer', surveyAnswerSchema);
