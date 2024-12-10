const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// Fetch all activity logs
exports.getAllActivityLogs = async (req, res) => {
  try {
    console.log('Fetching all activity logs...');
    const activityLogs = await ActivityLog.find().sort({ createdAt: -1 });
    console.log('Logs fetched:', activityLogs);

    if (!activityLogs.length) {
      return res.status(200).json({ message: 'No activity logs found.', activityLogs });
    }

    return res.status(200).json({ activityLogs });
  } catch (error) {
    console.error('Error fetching all logs:', error);
    return res.status(500).json({ message: 'Error fetching logs', error });
  }
};

// Fetch activity logs for a specific user
exports.getUserActivityLogs = async (req, res) => {
  const { userId } = req.params;
  try {
    console.log('Fetching activity logs for userId:', userId);
    const activityLogs = await ActivityLog.find({ user: userId }).sort({ createdAt: -1 });
    console.log('Logs fetched:', activityLogs);

    if (!activityLogs.length) {
      return res.status(200).json({ message: 'No activity logs for this user.', activityLogs });
    }

    return res.status(200).json({ activityLogs });
  } catch (error) {
    console.error('Error fetching user logs:', error);
    return res.status(500).json({ message: 'Error fetching user activity logs', error });
  }
};
