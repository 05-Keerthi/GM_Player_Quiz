const mongoose = require('mongoose');

const surveyAnswerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveyQuestion', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveySession', required: true },
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
  timeTaken: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SurveyAnswer', surveyAnswerSchema);
