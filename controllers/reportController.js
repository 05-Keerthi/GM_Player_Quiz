const Report = require("../models/Report");
const User = require("../models/User");

// GET all reports for admin analytics view
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("quiz")
      .populate("user")
      .sort({ completedAt: -1 });

    if (reports.length === 0) {
      return res.status(200).json({
        message: "No reports available",
        data: [],
      });
    }

    res.status(200).json({
      message: "All reports fetched successfully",
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET all reports for a specific user
exports.getUserReports = async (req, res) => {
  const { userId } = req.params;
  try {
    const reports = await Report.find({ user: userId })
      .populate("quiz")
      .populate("user")
      .sort({ completedAt: -1 }); // Sort by most recent first

    if (reports.length === 0) {
      return res.status(200).json({
        message: "No reports found for this user",
        data: [],
      });
    }

    res.status(200).json({
      message: "User reports fetched successfully",
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching user reports:", error);
    res.status(500).json({ message: "Error fetching user reports" });
  }
};

// GET report for a specific quiz
exports.getReportByQuiz = async (req, res) => {
  const { quizId } = req.params;
  try {
    const reports = await Report.find({ quiz: quizId })
      .populate("user")
      .populate("quiz")
      .sort({ completedAt: -1 });

    if (reports.length === 0) {
      return res.status(200).json({
        message: "No reports found for this quiz",
        data: [],
      });
    }

    res.status(200).json({
      message: "Reports fetched successfully for the quiz",
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching reports by quiz:", error);
    res.status(500).json({ message: "Error fetching reports by quiz" });
  }
};

// GET a specific user's report for a quiz
exports.getUserReportByQuiz = async (req, res) => {
  const { quizId, userId } = req.params;
  try {
    const report = await Report.findOne({ quiz: quizId, user: userId })
      .populate("quiz")
      .populate("user");

    if (!report) {
      return res.status(404).json({
        message: "Report not found",
        data: null,
      });
    }

    res.status(200).json({
      message: "User report fetched successfully",
      data: report,
    });
  } catch (error) {
    console.error("Error fetching user report:", error);
    res.status(500).json({ message: "Error fetching user report" });
  }
};

// GET quiz performance statistics
exports.getQuizStats = async (req, res) => {
  const { quizId } = req.params;
  try {
    const reports = await Report.find({ quiz: quizId });

    if (reports.length === 0) {
      return res.status(200).json({
        message: "No statistics available for this quiz",
        data: {
          totalAttempts: 0,
          averageScore: 0,
          passRate: 0,
        },
      });
    }

    const totalAttempts = reports.length;
    const averageScore =
      reports.reduce((acc, report) => acc + report.totalScore, 0) /
      totalAttempts;
    const passedAttempts = reports.filter(
      (report) => report.totalScore >= 80
    ).length;
    const passRate = (passedAttempts / totalAttempts) * 100;

    res.status(200).json({
      message: "Quiz statistics fetched successfully",
      data: {
        totalAttempts,
        averageScore: averageScore.toFixed(2),
        passRate: passRate.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Error fetching quiz statistics:", error);
    res.status(500).json({ message: "Error fetching quiz statistics" });
  }
};

module.exports = exports;
