const mongoose = require('mongoose');

const SurveyQuestionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    dimension: { type: String },
    year: { type: String },
    imageUrl: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    timer: { type: Number, default: 30 },
    answerOptions: [
        {
            optionText: { type: String, required: true }, 
            color: { type: String, default: "#FFFFFF" },
        }
    ],
    surveyQuiz: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveyQuiz', required: true },
    createdAt: { type: Date, default: Date.now }, 
});

module.exports = mongoose.model('SurveyQuestion', SurveyQuestionSchema);
