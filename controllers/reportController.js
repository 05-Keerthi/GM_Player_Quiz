const Report = require('../models/Report');
const User = require('../models/User');

// GET all reports for admin analytics view
exports.getAllReports = async (req, res) => {
    try {
      const reports = await Report.find().populate('quiz').populate('user');
      if (reports.length === 0) {
        return res.status(200).json({
          message: 'No reports available',
          data: [],
        });
      }
      res.status(200).json({
        message: 'All reports fetched successfully',
        data: reports,
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
// GET report for a specific quiz
exports.getReportByQuiz = async (req, res) => {
  const { quizId } = req.params;
  try {
    const reports = await Report.find({ quiz: quizId }).populate('user');
    res.status(200).json({
      message: 'Reports fetched successfully for the quiz',
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching reports by quiz:', error);
    res.status(500).json({ message: 'Error fetching reports by quiz' });
  }
};

// GET a specific user's report for a quiz
exports.getUserReportByQuiz = async (req, res) => {
  const { quizId, userId } = req.params;
  try {
    const report = await Report.findOne({ quiz: quizId, user: userId }).populate('user');
    if (!report) {
      return res.status(404).json({ message: 'Report not found for this quiz' });
    }
    res.status(200).json({
      message: 'User report fetched successfully',
      data: report,
    });
  } catch (error) {
    console.error('Error fetching user report:', error);
    res.status(500).json({ message: 'Error fetching user report' });
  }
};

