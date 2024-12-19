const mongoose = require('mongoose');

const SurveySlideSchema = new mongoose.Schema({
  surveyQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveyQuiz', required: true },
  surveyTitle: { type: String, required: true },
  surveyContent: { type: String, required: true },
  surveyType: { type: String, required: true, enum: ['classic', 'big_title', 'bullet_points']},
  imageUrl: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: false },
  position: { type: Number, required: false },
});

module.exports = mongoose.model('SurveySlide', SurveySlideSchema);
