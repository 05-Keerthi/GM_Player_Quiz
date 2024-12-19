const mongoose = require('mongoose');

const SurveyquizSchema = new mongoose.Schema({
  title: { type: String, required: false },
  description: { type: String },
  isPublic: { type: Boolean, default: true },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }],
  slides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SurveySlide' }],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SurveyQuestion' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft', 'active', 'closed'], default: 'draft' },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SurveyQuiz', SurveyquizSchema);
