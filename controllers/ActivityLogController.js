const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const Quiz = require('../models/quiz');
const SurveyQuiz = require('../models/surveyQuiz'); 
const Session = require('../models/session'); 
const SurveySession = require('../models/surveysession'); 

// Fetch all activity logs with counts for each activityType and filtering options
exports.getAllActivityLogs = async (req, res) => {
  try {
    const { filter, startDate, endDate } = req.query;

    // Define a base filter
    let dateFilter = {};

    // Apply filters based on the query
    const now = new Date();
    if (filter === 'day') {
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      };
    } else if (filter === 'week') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      dateFilter = {
        createdAt: {
          $gte: weekStart,
          $lt: weekEnd,
        },
      };
    } else if (filter === 'month') {
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        },
      };
    } else if (filter === 'year') {
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lt: new Date(now.getFullYear() + 1, 0, 1),
        },
      };
    } else if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Get filtered activity logs sorted by creation date
    const activityLogs = await ActivityLog.find(dateFilter).sort({ createdAt: -1 });

    // Define all possible activity types
    const allActivityTypes = [
      'login', 'quiz_create', 'quiz_play', 'quiz_status', 'quiz_session_status', 'survey_create', 'survey_play', 'survey_status', 'survey_session_status'
    ];

    // Get counts for each activityType
    const activityTypeCounts = await ActivityLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$activityType', 
          count: { $sum: 1 }  
        }
      }
    ]);

    // Initialize counts with all activity types set to 0
    const counts = allActivityTypes.reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {});

    // Merge actual counts from the aggregation
    activityTypeCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    // Fetch counts for 'quiz_session' statuses from Quiz model
    const quizSessionCounts = await Quiz.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status', 
          count: { $sum: 1 } 
        }
      }
    ]);

    // Initialize quiz session counts with all statuses set to 0
    const quizStatusCounts = {
      draft: 0,
      active: 0,
      closed: 0
    };

    // Merge actual counts from the Quiz model
    quizSessionCounts.forEach(item => {
      quizStatusCounts[item._id] = item.count;
    });

    // Add quiz session counts to the response under 'quiz_status'
    counts['quiz_status'] = quizStatusCounts;

    // Fetch counts for 'quiz_session_status' from Session model
    const sessionStatusCounts = await Session.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status', 
          count: { $sum: 1 } 
        }
      }
    ]);

    // Initialize session status counts with all possible statuses set to 0
    const quizSessionStatusCounts = {
      waiting: 0,
      in_progress: 0,
      completed: 0
    };

    // Merge actual counts from the Session model
    sessionStatusCounts.forEach(item => {
      quizSessionStatusCounts[item._id] = item.count;
    });

    // Add session counts to the response under 'quiz_session_status'
    counts['quiz_session_status'] = quizSessionStatusCounts;

    // Fetch counts for 'survey_session_status' from SurveySession model
    const surveySessionStatusCounts = await SurveySession.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$surveyStatus', 
          count: { $sum: 1 } 
        }
      }
    ]);

    // Initialize survey session status counts with all possible statuses set to 0
    const surveyStatusCounts = {
      waiting: 0,
      in_progress: 0,
      completed: 0
    };

    // Merge actual counts from the SurveySession model
    surveySessionStatusCounts.forEach(item => {
      surveyStatusCounts[item._id] = item.count;
    });

    // Add survey session counts to the response under 'survey_session_status'
    counts['survey_session_status'] = surveyStatusCounts;

    // Fetch counts for 'survey_session' statuses from SurveyQuiz model, grouped by type and status
    const surveyQuizCounts = await SurveyQuiz.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { type: "$type", status: "$status" }, 
          count: { $sum: 1 }
        }
      }
    ]);

    // Initialize survey session counts with all possible types and statuses set to 0
    const surveyQuizStatusCounts = {
      survey: { draft: 0, active: 0, closed: 0 },
      ArtPulse: { draft: 0, active: 0, closed: 0 }
    };

    // Merge actual counts from the SurveyQuiz model
    surveyQuizCounts.forEach(item => {
      const { type, status } = item._id;
      if (surveyQuizStatusCounts[type]) {
        surveyQuizStatusCounts[type][status] = item.count;
      }
    });

    // Add survey quiz counts to the response under 'survey_status'
    counts['survey_status'] = surveyQuizStatusCounts;

    if (!activityLogs.length) {
      return res.status(200).json({
        message: 'No activity logs found.',
        activityLogs: [],
        counts
      });
    }

    return res.status(200).json({
      activityLogs,
      counts
    });
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
