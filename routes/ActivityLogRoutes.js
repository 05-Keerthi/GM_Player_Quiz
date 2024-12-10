const express = require('express');
const router = express.Router();
const {
  getAllActivityLogs,
  getUserActivityLogs,
} = require('../controllers/ActivityLogController');
const { auth, isAdmin,} = require('../middlewares/auth');

// Route to get all activity logs (admin only)
router.get('/activity-logs',auth, isAdmin, getAllActivityLogs);

// Route to get activity logs for a specific user by userId (admin only)
router.get('/activity-logs/:userId',auth, isAdmin, getUserActivityLogs);

module.exports = router;
