const mongoose = require('mongoose');

const SurveyNotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Survey-Invitation', 'Survey-session_update', 'admin_notice'], 
    required: true 
  },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SurveySession' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SurveyNotification', SurveyNotificationSchema);
