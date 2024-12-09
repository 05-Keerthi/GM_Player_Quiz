const Notification = require('../models/Notification'); 
const User = require('../models/User'); 
const Session = require('../models/session'); 
const Quiz = require('../models/quiz'); // Import the Quiz model (if needed for validation)

// Create a new notification (admin only)
exports.createNotification = async (req, res) => {
  const { users, message, type, sessionId } = req.body;

  // Check if the logged-in user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ message: 'Invalid users array' });
  }

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ message: 'Invalid or missing sessionId' });
  }

  try {
    // Fetch session details and populate the quiz field
    const session = await Session.findById(sessionId).populate('quiz', 'title').exec();
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Extract QR code data, 6-digit code (joinCode), and quiz title
    const qrCodeData = session.qrData;
    const sixDigitCode = session.joinCode;
    const quizTitle = session.quiz?.title; // Quiz title from the populated quiz field

    if (!qrCodeData || !sixDigitCode || !quizTitle) {
      return res.status(400).json({ message: 'Invalid session or quiz data' });
    }

    // Default message for invitation type
    const invitationMessage = `You are invited to join the "${quizTitle}" quiz!`;
    const finalMessage = type === 'invitation' ? invitationMessage : message;

    // Create notifications for all users and include sessionId
    const notifications = users.map((user) => ({
      user,
      message: finalMessage,
      type,
      sessionId, // Add sessionId here
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: 'Notifications sent successfully',
      userIds: users,
      qrCodeData,
      sixDigitCode,
      quizTitle,
      invitationMessage, // Include default message in the response
    });
  } catch (error) {
    console.error('Error creating notifications:', error);
    res.status(500).json({ message: 'Error creating notifications', error });
  }
};


// Get all notifications for the authenticated user
exports.getNotifications = async (req, res) => {
  try {
    // Fetch all notifications for the current user, sorted by creation date
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });

    // For each notification, fetch session details and include quiz information
    const notificationsWithSessionData = await Promise.all(notifications.map(async (notification) => {
      // Check if sessionId exists in the notification
      if (!notification.sessionId) {
        return notification; // If no sessionId, return the notification as is
      }

      // Fetch session details using the sessionId in the notification
      const session = await Session.findById(notification.sessionId).populate('quiz', 'title').exec();
      
      // Check if session and quiz exist
      if (session) {
        const qrCodeData = session.qrData;
        const sixDigitCode = session.joinCode;
        const quizTitle = session.quiz?.title;

        // Add these values to the notification object
        return {
          ...notification.toObject(),
          qrCodeData,
          sixDigitCode,
          quizTitle,
        };
      } else {
        return notification; // Return the notification as is if no session found
      }
    }));

    // Send the response with the populated notifications
    res.status(200).json({ notifications: notificationsWithSessionData });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error });
  }
};



// Mark a notification as read
exports.markAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or unauthorized' });
    }

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read', error });
  }
};

// Delete a notification (admin only)
exports.deleteNotification = async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  try {
    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification', error });
  }
};
