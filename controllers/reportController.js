const Report = require("../models/Report");
const User = require("../models/User");
const Surveysession = require("../models/surveysession");
const Session = require("../models/session");
const SurveyAnswer = require("../models/surveyanswer");
const Answer = require("../models/answer");

// GET all reports for admin analytics view
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("quiz")
      .populate("surveyQuiz") 
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
      .populate("surveyQuiz") 
      .populate("user")
      .sort({ completedAt: -1 });

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

exports.getSessionsBySurveyQuiz = async (req, res) => {
  const { surveyquizId } = req.params;

  try {
    const sessions = await Surveysession.find({ surveyQuiz: surveyquizId })
      .populate("surveyHost", "username email")
      .populate("surveyPlayers") 
      .sort({ createdAt: -1 }); 

    if (sessions.length === 0) {
      return res.status(200).json({
        message: "No sessions found for this survey quiz",
        data: [],
      });
    }

    res.status(200).json({
      message: "Survey Quiz Sessions fetched successfully",
      data: sessions,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getSessionsByQuiz = async (req, res) => {
  const { quizId } = req.params; 

  try {
    const sessions = await Session.find({ quiz: quizId }) 
      .populate("quiz", "title description") 
      .populate("host")
      .populate("players")
      .sort({ createdAt: -1 }); 

    if (sessions.length === 0) {
      return res.status(200).json({
        message: "No sessions found for this quiz",
        data: [],
      });
    }

    res.status(200).json({
      message: "Quiz Sessions fetched successfully",
      data: sessions,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getSessionReport = async (req, res) => {
  const { sessionId } = req.params; 

  try {
    const session = await Session.findById(sessionId)
      .populate("host", "username email")
      .populate("questions", "title type options correctAnswer points timer")
      .populate("players", "username email mobile")


    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    const reports = await Report.find({ sessionId })
      .populate("user", "username email") 
      .sort({ completedAt: -1 });

    const questionIds = session.questions.map((question) => question._id);

    const answers = await Answer.find({
      session: sessionId,
      question: { $in: questionIds },
    })
      .populate("question", "title type options correctAnswer points timer") 
      .populate("user", "username email mobile"); 

    const answersGroupedByQuestion = questionIds.map((questionId) => {
      return {
        questionId,
        questionDetails: answers.find((a) => a.question._id.toString() === questionId.toString())?.question || null,
        answers: answers
          .filter((a) => a.question._id.toString() === questionId.toString())
          .map((a) => ({
            user: a.user,
            answer: a.answer,
            timeTaken: a.timeTaken,
          })),
      };
    });

    res.status(200).json({
      message: "Session report fetched successfully",
      data: {
        session,
        reports,
        answersGroupedByQuestion, 
      },
    });
  } catch (error) {
    console.error("Error fetching session report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getSurveySessionReport = async (req, res) => {
  const { surveysessionId } = req.params;

  try {
    const surveySession = await Surveysession.findById(surveysessionId)
      .populate("surveyHost", "username email")
      .populate("surveyPlayers", "username email mobile")
      .populate("surveyQuestions", "title description dimension year answerOptions");

    if (!surveySession) {
      return res.status(404).json({
        message: "Survey session not found",
      });
    }

    const reports = await Report.find({ surveySessionId: surveysessionId })
      .populate("user", "username email")
      .sort({ completedAt: -1 });

      const questionIds = surveySession.surveyQuestions.map((question) => question._id);

    const answers = await SurveyAnswer.find({
      surveySession: surveysessionId,
      surveyQuestion: { $in: questionIds },
    })
      .populate("surveyQuestion", "title description dimension year answerOptions") 
      .populate("surveyPlayers", "username email mobile");

    const answersGroupedByQuestion = questionIds.map((questionId) => {
      return {
        questionId,
        questionDetails: answers.find((a) => a.surveyQuestion._id.toString() === questionId.toString())?.surveyQuestion || null,
        answers: answers
          .filter((a) => a.surveyQuestion._id.toString() === questionId.toString())
          .map((a) => ({
            user: a.surveyPlayers,
            answer: a.surveyAnswer,
            timeTaken: a.timeTaken,
          })),
      };
    });

    res.status(200).json({
      message: "Survey session report fetched successfully",
      data: {
        surveySession,
        reports,
        answersGroupedByQuestion, 
      },
    });
  } catch (error) {
    console.error("Error fetching survey session report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getReportByQuiz = async (req, res) => {
  const { quizId } = req.params;

  try {
    
    const reports = await Report.find({ quiz: quizId })
      .populate("user", "username email") 
      .populate({
        path: "quiz",
        select: "title description categories type", 
        populate: {
          path: "categories",
          select: "name description", 
        },
      })
      .populate({
        path: "sessionId", 
        populate: [
          {
            path: "players",
            select: "username email mobile", 
          },
          {
            path: "questions",
            select: "title type options", 
          },
        ],
      })
      .sort({ completedAt: -1 }); 

  
    const sessionCount = await Session.countDocuments({ quiz: quizId });

    if (reports.length === 0) {
      return res.status(200).json({
        message: "No reports found for this quiz",
        sessionCount,
        data: [],
      });
    }

    res.status(200).json({
      message: "Reports fetched successfully for the quiz",
      sessionCount,
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching reports by quiz:", error);
    res.status(500).json({
      message: "Error fetching reports by quiz",
      error: error.message,
    });
  }
};


exports.getReportBySurveyQuiz = async (req, res) => {
  const { surveyquizId } = req.params;

  try {
    const reports = await Report.find({ surveyQuiz: surveyquizId })
      .populate("user", "username email") 
      .populate({
        path: "surveyQuiz",
        select: "title description categories type",
        populate: {
          path: "categories",
          select: "name description", 
        },
      })
      .populate({
        path: "surveySessionId", 
        populate: [
          {
            path: "surveyPlayers", 
            select: "username email mobile", 
          },
          {
            path: "surveyQuestions",
            select: "title description dimension year answerOptions", 
          },
        ],
      })
      
      .sort({ completedAt: -1 }); 

    const sessionCount = await Surveysession.countDocuments({ surveyQuiz: surveyquizId });

    if (reports.length === 0) {
      return res.status(200).json({
        message: "No reports found for this survey quiz",
        sessionCount,
        data: [],
      });
    }

    res.status(200).json({
      message: "Reports fetched successfully for the survey quiz",
      sessionCount,
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching reports by survey quiz:", error);
    res.status(500).json({ message: "Error fetching reports by survey quiz" });
  }
};

module.exports = exports;
