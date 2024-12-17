const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activityType: { 
    type: String, 
    enum: ['login', 'quiz_create', 'quiz_play', 'quiz_share', 'survey_create', 'subscription_change'], 
    required: true 
  },
  details: { type: Map, of: String }, // Additional details stored as key-value pairs
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
