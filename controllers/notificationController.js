const Notification = require('../models/Notification'); 
const User = require('../models/User'); 
const Session = require('../models/session'); 
const Quiz = require('../models/quiz'); // Import the Quiz model (if needed for validation)
const Leaderboard = require('../models/leaderBoard');

// Create a new notification (admin only)
exports.createNotification = async (req, res) => {
  const { message, type, sessionId } = req.body;

  // Check if the logged-in user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ message: 'Invalid or missing sessionId' });
  }

  try {
    // Fetch session details
    const session = await Session.findById(sessionId).populate('quiz', 'title').exec();

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Extract necessary data
    const qrCodeData = session.qrData;
    const sixDigitCode = session.joinCode;
    const quizTitle = session.quiz?.title;

    if (!qrCodeData || !sixDigitCode || !quizTitle) {
      return res.status(400).json({ message: 'Invalid session or quiz data' });
    }

    let finalMessage;
    let usersToNotify;

    // Handle different notification types
    if (type === 'invitation') {
      finalMessage = `You are invited to join the "${quizTitle}" quiz!`;
      // For invitations, users must be passed in the request body
      if (!Array.isArray(req.body.users) || req.body.users.length === 0) {
        return res.status(400).json({ message: 'No users provided for invitation.' });
      }
      usersToNotify = req.body.users;
    } else if (type === 'session_update') {
      // Fetch users from existing notifications for the session
      const existingNotifications = await Notification.find({ sessionId }, 'user');
      if (!existingNotifications.length) {
        return res
          .status(400)
          .json({ message: 'No users found to notify for this session. Ensure invitations were sent.' });
      }
      usersToNotify = existingNotifications.map((notification) => notification.user);

      finalMessage =
        message ||
        `The session for "${quizTitle}" has started. If you have not yet joined the quiz, you will not be able to participate.`;
    } else if (type === 'quiz_result') {
      // Fetch leaderboard details for the session
      const leaderboardEntries = await Leaderboard.find({ session: sessionId })
        .populate('player', 'name') // Populate player details
        .exec();

      if (!leaderboardEntries.length) {
        return res
          .status(400)
          .json({ message: 'No leaderboard data found for this session.' });
      }

      // Prepare notifications for each user based on leaderboard
      usersToNotify = leaderboardEntries.map((entry) => entry.player._id);
      const notifications = leaderboardEntries.map((entry) => ({
        user: entry.player._id,
        message: `Your quiz result for "${quizTitle}" is ready! Score: ${entry.score}, Rank: ${entry.rank || 'N/A'}.`,
        type,
        sessionId,
      }));

      await Notification.insertMany(notifications);

      return res.status(201).json({
        success: true,
        message: 'Quiz result notifications sent successfully.',
        leaderboard: leaderboardEntries.map((entry) => ({
          player: entry.player.name,
          score: entry.score,
          rank: entry.rank,
        })),
      });
    } else {
      return res.status(400).json({ message: 'Invalid notification type' });
    }

    // Ensure there are users to notify
    if (!Array.isArray(usersToNotify) || usersToNotify.length === 0) {
      return res.status(400).json({ message: 'No users found to notify for this session.' });
    }

    // Create notifications for all users (excluding quiz_result handled above)
    const notifications = usersToNotify.map((user) => ({
      user,
      message: finalMessage,
      type,
      sessionId,
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: 'Notifications sent successfully',
      userIds: usersToNotify,
      qrCodeData,
      sixDigitCode,
      quizTitle,
      finalMessage,
    });
  } catch (error) {
    console.error('Error creating notifications:', error);
    res.status(500).json({ message: 'Error creating notifications', error });
  }
};



// Get all notifications for the authenticated user
// GET /api/notifications/:userId - Get all notifications for the authenticated user or a specific user by userId
exports.getNotificationsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    // Check if the logged-in user is trying to access their own notifications or if they are an admin
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. You can only view your own notifications or access another user\'s notifications if you are an admin.' 
      });
    }

    // Fetch all notifications for the user (either the authenticated user or the user specified in the URL)
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });

    if (notifications.length === 0) {
      // Return a specific message if no notifications exist for the user
      return res.status(404).json({ 
        message: `No invitations have been sent to this user (User ID: ${userId}).`, 
        notifications: null 
      });
    }

    // For each notification, fetch session details and include quiz information
    const notificationsWithSessionData = await Promise.all(notifications.map(async (notification) => {
      if (!notification.sessionId) {
        return notification; // If no sessionId, return the notification as is
      }

      const session = await Session.findById(notification.sessionId).populate('quiz', 'title').exec();
      
      if (session) {
        const qrCodeData = session.qrData;
        const sixDigitCode = session.joinCode;
        const quizTitle = session.quiz?.title;

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
