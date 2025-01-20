const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
activityType: { 
    type: String, 
    enum: ['login', 'quiz_create', 'quiz_play', 'quiz_status', 'quiz_session_status', 'survey_create', 'survey_play', 'survey_status', 'survey_session_status',], 
    required: true 
  },
  details: { type: Map, of: String }, 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
