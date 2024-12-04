const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: false },
  description: { type: String },
  isPublic: { type: Boolean, default: true },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }],
  slides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Slide' }],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft', 'active', 'closed'], default: 'draft' },
  order: [{ type: String }],
  duration: { type: Number, default: 60 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Quiz', quizSchema);
