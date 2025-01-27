// const Report = require("../models/Report");
// const User = require("../models/User");
// const Surveysession = require("../models/surveysession");
// const Session = require("../models/session");
// const SurveyAnswer = require("../models/surveyanswer");
// const Answer = require("../models/answer");
// const SurveyQuiz = require("../models/surveyQuiz");

// // GET all reports for admin analytics view
// exports.getAllReports = async (req, res) => {
//   try {
//     const reports = await Report.find()
//       .populate("quiz")
//       .populate("surveyQuiz") 
//       .populate("user")
//       .sort({ completedAt: -1 });

//     if (reports.length === 0) {
//       return res.status(200).json({
//         message: "No reports available",
//         data: [],
//       });
//     }

//     res.status(200).json({
//       message: "All reports fetched successfully",
//       data: reports,
//     });
//   } catch (error) {
//     console.error("Error fetching reports:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// // GET all reports for a specific user
// exports.getUserReports = async (req, res) => {
//   const { userId } = req.params;
//   try {
//     const reports = await Report.find({ user: userId })
//       .populate("quiz")
//       .populate("surveyQuiz") 
//       .populate("user")
//       .sort({ completedAt: -1 });

//     if (reports.length === 0) {
//       return res.status(200).json({
//         message: "No reports found for this user",
//         data: [],
//       });
//     }

//     res.status(200).json({
//       message: "User reports fetched successfully",
//       data: reports,
//     });
//   } catch (error) {
//     console.error("Error fetching user reports:", error);
//     res.status(500).json({ message: "Error fetching user reports" });
//   }
// };

// exports.getSessionsBySurveyQuiz = async (req, res) => {
//   const { surveyquizId } = req.params;

//   try {
//     const sessions = await Surveysession.find({ surveyQuiz: surveyquizId })
//       .populate("surveyHost", "username email")
//       .populate("surveyPlayers") 
//       .sort({ createdAt: -1 }); 

//     if (sessions.length === 0) {
//       return res.status(200).json({
//         message: "No sessions found for this survey quiz",
//         data: [],
//       });
//     }

//     res.status(200).json({
//       message: "Survey Quiz Sessions fetched successfully",
//       data: sessions,
//     });
//   } catch (error) {
//     console.error("Error fetching sessions:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.getSessionsByQuiz = async (req, res) => {
//   const { quizId } = req.params; 

//   try {
//     const sessions = await Session.find({ quiz: quizId }) 
//       .populate("quiz", "title description") 
//       .populate("host")
//       .populate("players")
//       .sort({ createdAt: -1 }); 

//     if (sessions.length === 0) {
//       return res.status(200).json({
//         message: "No sessions found for this quiz",
//         data: [],
//       });
//     }

//     res.status(200).json({
//       message: "Quiz Sessions fetched successfully",
//       data: sessions,
//     });
//   } catch (error) {
//     console.error("Error fetching sessions:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.getSessionReport = async (req, res) => {
//   const { sessionId } = req.params; 

//   try {
//     const session = await Session.findById(sessionId)
//       .populate("host", "username email")
//       .populate("questions", "title type options correctAnswer points timer")
//       .populate("players", "username email mobile")


//     if (!session) {
//       return res.status(404).json({
//         message: "Session not found",
//       });
//     }

//     const reports = await Report.find({ sessionId })
//       .populate("user", "username email") 
//       .sort({ completedAt: -1 });

//     const questionIds = session.questions.map((question) => question._id);

//     const answers = await Answer.find({
//       session: sessionId,
//       question: { $in: questionIds },
//     })
//       .populate("question", "title type options correctAnswer points timer") 
//       .populate("user", "username email mobile"); 

//     const answersGroupedByQuestion = questionIds.map((questionId) => {
//       return {
//         questionId,
//         questionDetails: answers.find((a) => a.question._id.toString() === questionId.toString())?.question || null,
//         answers: answers
//           .filter((a) => a.question._id.toString() === questionId.toString())
//           .map((a) => ({
//             user: a.user,
//             answer: a.answer,
//             timeTaken: a.timeTaken,
//           })),
//       };
//     });

//     res.status(200).json({
//       message: "Session report fetched successfully",
//       data: {
//         session,
//         reports,
//         answersGroupedByQuestion, 
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching session report:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.getSurveySessionReport = async (req, res) => {
//   const { surveysessionId } = req.params;

//   try {
//     const surveySession = await Surveysession.findById(surveysessionId)
//       .populate("surveyHost", "username email")
//       .populate("surveyPlayers", "username email mobile")
//       .populate("surveyQuestions", "title description dimension year answerOptions");

//     if (!surveySession) {
//       return res.status(404).json({
//         message: "Survey session not found",
//       });
//     }

//     const reports = await Report.find({ surveySessionId: surveysessionId })
//       .populate("user", "username email")
//       .sort({ completedAt: -1 });

//       const questionIds = surveySession.surveyQuestions.map((question) => question._id);

//     const answers = await SurveyAnswer.find({
//       surveySession: surveysessionId,
//       surveyQuestion: { $in: questionIds },
//     })
//       .populate("surveyQuestion", "title description dimension year answerOptions") 
//       .populate("surveyPlayers", "username email mobile");

//     const answersGroupedByQuestion = questionIds.map((questionId) => {
//       return {
//         questionId,
//         questionDetails: answers.find((a) => a.surveyQuestion._id.toString() === questionId.toString())?.surveyQuestion || null,
//         answers: answers
//           .filter((a) => a.surveyQuestion._id.toString() === questionId.toString())
//           .map((a) => ({
//             user: a.surveyPlayers,
//             answer: a.surveyAnswer,
//             timeTaken: a.timeTaken,
//           })),
//       };
//     });

//     res.status(200).json({
//       message: "Survey session report fetched successfully",
//       data: {
//         surveySession,
//         reports,
//         answersGroupedByQuestion, 
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching survey session report:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.getReportByQuiz = async (req, res) => {
//   const { quizId } = req.params;

//   try {
    
//     const reports = await Report.find({ quiz: quizId })
//       .populate("user", "username email") 
//       .populate({
//         path: "quiz",
//         select: "title description categories type", 
//         populate: {
//           path: "categories",
//           select: "name description", 
//         },
//       })
//       .populate({
//         path: "sessionId", 
//         populate: [
//           {
//             path: "players",
//             select: "username email mobile", 
//           },
//           {
//             path: "questions",
//             select: "title type options", 
//           },
//         ],
//       })
//       .sort({ completedAt: -1 }); 

  
//     const sessionCount = await Session.countDocuments({ quiz: quizId });

//     if (reports.length === 0) {
//       return res.status(200).json({
//         message: "No reports found for this quiz",
//         sessionCount,
//         data: [],
//       });
//     }

//     res.status(200).json({
//       message: "Reports fetched successfully for the quiz",
//       sessionCount,
//       data: reports,
//     });
//   } catch (error) {
//     console.error("Error fetching reports by quiz:", error);
//     res.status(500).json({
//       message: "Error fetching reports by quiz",
//       error: error.message,
//     });
//   }
// };


// exports.getReportBySurveyQuiz = async (req, res) => {
//   const { surveyquizId } = req.params;

//   try {
//     const reports = await Report.find({ surveyQuiz: surveyquizId })
//       .populate("user", "username email") 
//       .populate({
//         path: "surveyQuiz",
//         select: "title description categories type",
//         populate: {
//           path: "categories",
//           select: "name description", 
//         },
//       })
//       .populate({
//         path: "surveySessionId", 
//         populate: [
//           {
//             path: "surveyPlayers", 
//             select: "username email mobile", 
//           },
//           {
//             path: "surveyQuestions",
//             select: "title description dimension year answerOptions", 
//           },
//         ],
//       })
      
//       .sort({ completedAt: -1 }); 

//     const sessionCount = await Surveysession.countDocuments({ surveyQuiz: surveyquizId });

//     if (reports.length === 0) {
//       return res.status(200).json({
//         message: "No reports found for this survey quiz",
//         sessionCount,
//         data: [],
//       });
//     }

//     res.status(200).json({
//       message: "Reports fetched successfully for the survey quiz",
//       sessionCount,
//       data: reports,
//     });
//   } catch (error) {
//     console.error("Error fetching reports by survey quiz:", error);
//     res.status(500).json({ message: "Error fetching reports by survey quiz" });
//   }
// };

// module.exports = exports;

const Report = require("../models/Report");
const Quiz = require("../models/quiz");
const Session = require("../models/session");
const Answer = require("../models/answer");
const SurveyAnswer = require("../models/surveyanswer");
const mongoose = require("mongoose");

// Get list of all quizzes participated
const getParticipatedQuizzesAndSurveys = async (req, res) => {
  try {
    const userId = req.user._id;

    // Aggregation for quizzes
    const quizzes = await Report.aggregate([
      { $match: { user: userId, quiz: { $exists: true } } },
      {
        $group: {
          _id: "$quiz",
          attempts: { $sum: 1 },
          lastAttempt: { $max: "$completedAt" },
        },
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "_id",
          as: "QuizDetails",
        },
      },
      { $unwind: "$QuizDetails" },
      {
        $project: {
          _id: 0,
          QuizId: "$_id",
          attempts: 1,
          lastAttempt: 1,
          QuizDetails: {
            quizTitle: "$QuizDetails.title",
            quizDescription: "$QuizDetails.description",
          },
        },
      },
    ]);

    // Aggregation for surveys
    const surveys = await Report.aggregate([
      { $match: { user: userId, surveyQuiz: { $exists: true } } },
      {
        $group: {
          _id: "$surveyQuiz",
          attempts: { $sum: 1 },
          lastAttempt: { $max: "$completedAt" },
        },
      },
      {
        $lookup: {
          from: "surveyquizzes",
          localField: "_id",
          foreignField: "_id",
          as: "SurveyDetails",
        },
      },
      { $unwind: "$SurveyDetails" },
      {
        $project: {
          _id: 0,
          SurveyId: "$_id",
          attempts: 1,
          lastAttempt: 1,
          SurveyDetails: {
            surveyTitle: "$SurveyDetails.title",
            surveyDescription: "$SurveyDetails.description",
          },
        },
      },
    ]);

    res.json({ quizzes, surveys });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get detailed attempts for a specific quiz
const getQuizAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user._id;

    const attempts = await Report.aggregate([
      {
        $match: {
          quiz: new mongoose.Types.ObjectId(quizId),
          user: userId,
        },
      },
      {
        $lookup: {
          from: "sessions",
          localField: "sessionId",
          foreignField: "_id",
          as: "sessionDetails",
        },
      },
      {
        $unwind: "$sessionDetails",
      },
      {
        $lookup: {
          from: "users",
          localField: "sessionDetails.host",
          foreignField: "_id",
          as: "hostDetails",
        },
      },
      {
        $unwind: "$hostDetails",
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "sessionDetails.quiz",
          foreignField: "_id",
          as: "quizDetails",
        },
      },
      {
        $unwind: "$quizDetails",
      },
      {
        $lookup: {
          from: "categories",
          localField: "quizDetails.categories",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $project: {
          _id: 1,
          sessionDetails: {
            quiz: {
              _id: "$quizDetails._id",
              quizTitle: "$quizDetails.title",
              quizDescription: "$quizDetails.description",
              quizCategories: "$categoryDetails.name",
            },
            sessionId: "$sessionDetails._id",
            host: "$hostDetails.username",
            status: "$sessionDetails.status",
            startTime: "$sessionDetails.startTime",
            endTime: "$sessionDetails.endTime",
          },
          correctAnswers: 1,
          incorrectAnswers: 1,
          completedAt: 1,
        },
      },
    ]);

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSurveyAttempts = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const userId = req.user._id;

    // Validate surveyId and userId
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      return res.status(400).json({ message: "Invalid surveyId" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    console.log("SurveyId:", surveyId, "UserId:", userId);

    // Perform aggregation
    const attempts = await Report.aggregate([
      {
        $match: {
          surveyQuiz: new mongoose.Types.ObjectId(surveyId),
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "surveysessions",
          localField: "surveySessionId",
          foreignField: "_id",
          as: "surveySessionDetails",
        },
      },
      {
        $unwind: {
          path: "$surveySessionDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "surveyquizzes",
          localField: "surveyQuiz",
          foreignField: "_id",
          as: "surveyQuizDetails",
        },
      },
      {
        $unwind: {
          path: "$surveyQuizDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "surveyQuizDetails.categories",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users", // Replace with the actual collection name
          localField: "surveySessionDetails.surveyHost",
          foreignField: "_id",
          as: "hostDetails",
        },
      },
      {
        $unwind: {
          path: "$hostDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          correctAnswers: 1,
          questionsAttempted: 1,
          questionsSkipped: 1,
          surveySessionDetails: {
            surveyQuiz: {
              _id: "$surveyQuizDetails._id",
              quizTitle: "$surveyQuizDetails.title",
              quizDescription: "$surveyQuizDetails.description",
              quizCategories: "$categoryDetails.name",
            },
            sessionId: "$surveySessionDetails._id",
            host: "$hostDetails.username", 
            status: "$surveySessionDetails.surveyStatus",
            startTime: "$surveySessionDetails.startTime",
            endTime: "$surveySessionDetails.endTime",
            questions: "$surveyQuestions",
          },
        },
      },
    ]);
    
    

    console.log("Aggregation Result:", attempts);

    if (!attempts || attempts.length === 0) {
      return res.status(404).json({ message: "No survey attempts found" });
    }

    // Send response
    res.json(attempts);
  } catch (error) {
    console.error("Error in getSurveyAttempts:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get detailed responses for a specific session
const getSessionResponses = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const answers = await Answer.aggregate([
      {
        $match: {
          session: new mongoose.Types.ObjectId(sessionId),
          user: userId,
        },
      },
      {
        $lookup: {
          from: "questions",
          localField: "question",
          foreignField: "_id",
          as: "questionDetails",
        },
      },
      { $unwind: "$questionDetails" },
      {
        $project: {
          question: "$questionDetails.title",
          questionType: "$questionDetails.type",
          options: "$questionDetails.options",
          explanation: "$questionDetails.explanation",
          submittedAnswer: "$answer",
          isCorrect: 1,
          timeTaken: 1,
          answerType: 1,
        },
      },
      { $sort: { createdAt: 1 } },
    ]);

    const sessionReport = await Report.findOne({
      sessionId,
      user: userId,
    }).select("score timeTaken correctAnswers incorrectAnswers");

    res.json({
      summary: sessionReport,
      answers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get detailed responses for a specific survey session
const getSurveyResponses = async (req, res) => {
  try {
    const { surveySessionId } = req.params;
    const userId = req.user._id;

    const answers = await SurveyAnswer.aggregate([
      {
        $match: {
          surveySession: new mongoose.Types.ObjectId(surveySessionId),
          surveyPlayers: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "surveyquestions", // Ensure this matches the actual collection name
          localField: "surveyQuestion",
          foreignField: "_id",
          as: "questionDetails",
        },
      },
      { $unwind: "$questionDetails" },
      {
        $project: {
          question_title: "$questionDetails.title",
          question_description: "$questionDetails.description",
          options: "$questionDetails.answerOptions",
          submittedAnswer: "$surveyAnswer", // Correct field reference
          timeTaken: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: 1 } }, // Sort by creation time
    ]);

    const sessionReport = await Report.findOne({
      surveySessionId,
      user: userId,
    }).select("questionsAttempted questionsSkipped timeTaken");

    res.json({
      summary: sessionReport || {},
      answers,
    });
  } catch (error) {
    console.error("Error fetching survey responses:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET all reports for admin analytics view
const getAllReports = async (req, res) => {
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

module.exports = {
  getParticipatedQuizzesAndSurveys,
  getQuizAttempts,
  getSurveyAttempts,
  getSessionResponses,
  getSurveyResponses,
  getAllReports
};



