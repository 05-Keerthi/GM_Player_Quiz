const SurveyNotification = require('../models/SurveyNotification');
const SurveySession = require('../models/surveysession');
const SurveyQuiz = require('../models/surveyQuiz');
const User = require('../models/User');
const { sendSurveyInvitationMail, sendSurveySessionUpdateMail } = require('../services/mailService');

// Create a new Survey Notification
exports.createSurveyNotification = async (req, res) => {
    const { message, type, sessionId, users } = req.body;
  
    // Validate if logged-in user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
  
    if (!type) {
      return res.status(400).json({ message: 'Notification type is required.' });
    }
  
    try {
      let finalMessage;
      let usersToNotify;
      let sessionDetails;
      let qrCodeData;
      let joinCode;
      let quizTitle;
  
      // Handle notification types
      if (type === 'Survey-Invitation') {
        if (!Array.isArray(users) || users.length === 0) {
          return res.status(400).json({ message: 'No users provided for the survey invitation.' });
        }
  
        sessionDetails = await SurveySession.findById(sessionId).populate('surveyQuiz', 'title surveyQrData surveyJoinCode').exec();
  
        if (!sessionDetails) {
          return res.status(404).json({ message: 'Survey session not found' });
        }
  
        quizTitle = sessionDetails.surveyQuiz?.title;
        qrCodeData = sessionDetails.surveyQrData;
        joinCode = sessionDetails.surveyJoinCode;
  
        if (!quizTitle || !qrCodeData || !joinCode) {
          return res.status(400).json({ message: 'Invalid session data for notification.' });
        }
  
        finalMessage = `You are invited to join the "${quizTitle}" survey! Join using the provided code or QR code.`;
  
        usersToNotify = users;
  
        // Send emails to the users
        for (let userId of usersToNotify) {
          const user = await User.findById(userId);
          if (user) {
            await sendSurveyInvitationMail(user.email, user.username, quizTitle, qrCodeData, joinCode);
          }
        }
      } else if (type === 'Survey-session_update') {
        const session = await SurveySession.findById(sessionId).populate('surveyQuiz', 'title').exec();
  
        if (!session) {
          return res.status(404).json({ message: 'Session not found.' });
        }
  
        finalMessage = `The session for "${session.surveyQuiz?.title}" has been updated.`;
        const notifications = await SurveyNotification.find({ sessionId }, 'user');
        usersToNotify = notifications.map((n) => n.user);
  
        for (let userId of usersToNotify) {
          const user = await User.findById(userId);
          if (user) {
            await sendSurveySessionUpdateMail(user.email, user.username, session.surveyQuiz?.title);
          }
        }
      } else {
        return res.status(400).json({ message: 'Invalid notification type.' });
      }
  
      if (!usersToNotify?.length) {
        return res.status(400).json({ message: 'No users found to notify.' });
      }
  
      const notificationsToInsert = usersToNotify.map((user) => ({
        user,
        message: finalMessage,
        type,
        sessionId,
        qrCodeData,
        joinCode,
        quizTitle,
      }));
  
      await SurveyNotification.insertMany(notificationsToInsert);
  
      const io = req.app.get('socketio');
      io?.emit('send-survey-notification', {
        type,
        message: finalMessage,
        users: usersToNotify,
        sessionId,
        qrCodeData,
        joinCode,
        quizTitle,
      });
  
      res.status(201).json({
        success: true,
        message: 'Survey notifications sent successfully.',
        users: usersToNotify,
        finalMessage,
        quizTitle,
        qrCodeData,
        joinCode,
      });
    } catch (error) {
      console.error('Error creating survey notifications:', error);
      res.status(500).json({ message: 'Internal server error', error });
    }
  };
exports.getSurveyNotificationsByUserId = async (req, res) => {
    const { userId } = req.params;
  
    try {
      // Allow only authenticated users or admin to access other user's notifications
      if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          message: 'Access denied. You can only view your own survey notifications or access another user\'s notifications if you are an admin.',
        });
      }
  
      // Fetch all survey notifications related to the user
      const notifications = await SurveyNotification.find({ user: userId }).sort({ createdAt: -1 });
  
  
      // Map over notifications and fetch the related survey session details
      const notificationsWithSessionData = await Promise.all(
        notifications.map(async (notification) => {
          if (!notification.sessionId) {
            return notification; 
          }
  
          const surveySession = await SurveySession.findById(notification.sessionId).populate(
            'surveyQuiz',
            'title description'
          ).exec();
  
          if (surveySession) {
            const qrCodeData = surveySession.surveyQrData;
            const joinCode = surveySession.surveyJoinCode;
            const surveyTitle = surveySession.surveyQuiz?.title;
  
            return {
              ...notification.toObject(),
              qrCodeData,
              joinCode,
              surveyTitle,
            };
          } else {
            return notification; 
          }
        })
      );
  
      // Send the response with the mapped notifications
      res.status(200).json({ notifications: notificationsWithSessionData });
    } catch (error) {
      console.error('Error fetching survey notifications:', error);
      res.status(500).json({ message: 'Error fetching survey notifications', error });
    }
  };

// Mark a survey notification as read
exports.markSurveyNotificationAsRead = async (req, res) => {
    const { id } = req.params;
  
    try {
      const surveyNotification = await SurveyNotification.findOneAndUpdate(
        { _id: id, user: req.user._id },
        { read: true },
        { new: true }
      );
  
      if (!surveyNotification) {
        return res.status(404).json({ message: 'Survey notification not found or unauthorized' });
      }
  
      // Emit WebSocket event
      const io = req.app.get("socketio");
      io.emit('mark-survey-notification-read', {
        userId: req.user._id,
        surveyNotificationId: id,
      });
  
      res.status(200).json({ 
        message: 'Survey notification marked as read',
        surveyNotification,
      });
    } catch (error) {
      console.error('Error marking survey notification as read:', error);
      res.status(500).json({ message: 'Error marking survey notification as read', error });
    }
  };

// Delete a survey notification
exports.deleteSurveyNotification = async (req, res) => {
    const { id } = req.params;
  
    // Ensure only admin can delete a survey notification
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }
  
    try {
      const surveyNotification = await SurveyNotification.findByIdAndDelete(id);
  
      if (!surveyNotification) {
        return res.status(404).json({ message: 'Survey notification not found' });
      }
  
      res.status(200).json({ message: 'Survey notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting survey notification:', error);
      res.status(500).json({ message: 'Error deleting survey notification', error });
    }
  };