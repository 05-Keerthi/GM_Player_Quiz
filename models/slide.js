const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, required: true, enum: ['classic', 'big_title', 'bullet_points']},
  imageUrl: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: false },
  position: { type: Number, required: false },
});

module.exports = mongoose.model('Slide', slideSchema);
