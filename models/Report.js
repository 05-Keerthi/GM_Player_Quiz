const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  surveyQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveyQuiz' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
  surveySessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveySession' },
  totalQuestions: Number,
  surveyTotalQuestions: Number,
  correctAnswers: Number,
  incorrectAnswers: Number,
  score: Number,
  timeTaken: Number,
  questionsAttempted: Number,
  questionsSkipped: Number,
  surveyTotalQuestions: Number, 
  completedAt: { type: Date, default: Date.now },
});

reportSchema.index({ user: 1, quiz: 1 }); 
reportSchema.index({ sessionId: 1 });
reportSchema.index({ user: 1, surveyQuiz: 1 }); 
reportSchema.index({ surveySessionId: 1 }); 

module.exports = mongoose.model("Report", reportSchema);
