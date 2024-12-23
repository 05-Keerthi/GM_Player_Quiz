const mongoose = require('mongoose');

const SurveySlideSchema = new mongoose.Schema({
  surveyQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveyQuiz', required: true },
  surveyTitle: { type: String, required: true },
  surveyContent: { type: String, required: true },
  imageUrl: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: false },
  position: { type: Number, required: false },
});

module.exports = mongoose.model('SurveySlide', SurveySlideSchema);
