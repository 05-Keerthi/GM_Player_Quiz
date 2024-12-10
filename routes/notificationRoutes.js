const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth, isAdmin } = require('../middlewares/auth'); // Add your auth middlewares

// Create a notification (admin only)
router.post('/notifications', auth, isAdmin, notificationController.createNotification);

// // Get all notifications for the authenticated user
// router.get('/notifications', auth, notificationController.getNotifications);

router.get('/notifications/:userId',auth, notificationController.getNotificationsByUserId);


// Mark a notification as read
router.put('/notifications/:id', auth, notificationController.markAsRead);

// Delete a notification (admin only)
router.delete('/notifications/:id', auth, isAdmin, notificationController.deleteNotification);

module.exports = router;
