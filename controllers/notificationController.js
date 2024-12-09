const Notification = require('../models/Notification'); 
const User = require('../models/User'); 

// Create a new notification (admin only)
exports.createNotification = async (req, res) => {
  const { users, message, type } = req.body;

  // Check if the logged-in user is an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }

  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ message: 'Invalid users array' });
  }

  try {
    // Create notifications for all users
    const notifications = users.map((user) => ({
      user,
      message,
      type,
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({ 
      message: 'Notifications created successfully', 
      notifications 
    });
  } catch (error) {
    console.error('Error creating notifications:', error);
    res.status(500).json({ message: 'Error creating notifications', error });
  }
};


// Get all notifications for the authenticated user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ notifications });
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
