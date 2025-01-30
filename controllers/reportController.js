const Report = require("../models/Report");
const Quiz = require("../models/quiz");
const SurveyQuiz = require("../models/surveyQuiz");
const Session = require("../models/session");
const Leaderboard = require("../models/leaderBoard");
const SurveySession = require("../models/surveysession");
const User = require("../models/User");
const Answer = require("../models/answer");
const SurveyAnswer = require("../models/surveyanswer");
const mongoose = require("mongoose");
const Media = require("../models/Media");

// Get list of all quizzes participated
const getParticipatedQuizzesAndSurveys = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get total time from all quiz sessions
    const quizSessionsTotalTime = await Session.aggregate([
      {
        $match: {
          players: userId,
          startTime: { $exists: true },
          endTime: { $exists: true },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalTime: {
            $sum: {
              $trunc: {
                $divide: [
                  { $subtract: ["$endTime", "$startTime"] },
                  1000, // Convert to seconds
                ],
              },
            },
          },
        },
      },
    ]);

    // Get total time from all survey sessions
    const surveySessionsTotalTime = await SurveySession.aggregate([
      {
        $match: {
          surveyPlayers: userId,
          startTime: { $exists: true },
          endTime: { $exists: true },
          surveyStatus: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalTime: {
            $sum: {
              $trunc: {
                $divide: [
                  { $subtract: ["$endTime", "$startTime"] },
                  1000, // Convert to seconds
                ],
              },
            },
          },
        },
      },
    ]);

    const totalTime =
      (quizSessionsTotalTime[0]?.totalTime || 0) +
      (surveySessionsTotalTime[0]?.totalTime || 0);

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
          from: "sessions",
          let: { quizId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$quiz", "$$quizId"] },
                    { $in: [userId, "$players"] },
                    { $eq: ["$status", "completed"] },
                  ],
                },
              },
            },
            {
              $project: {
                timeTaken: {
                  $trunc: {
                    $divide: [
                      { $subtract: ["$endTime", "$startTime"] },
                      1000, // Convert to seconds
                    ],
                  },
                },
              },
            },
          ],
          as: "sessions",
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
          totalTimeTaken: {
            $trunc: { $sum: "$sessions.timeTaken" },
          },
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
          from: "surveysessions",
          let: { surveyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$surveyQuiz", "$$surveyId"] },
                    { $in: [userId, "$surveyPlayers"] },
                    { $eq: ["$surveyStatus", "completed"] },
                  ],
                },
              },
            },
            {
              $project: {
                timeTaken: {
                  $trunc: {
                    $divide: [
                      { $subtract: ["$endTime", "$startTime"] },
                      1000, // Convert to seconds
                    ],
                  },
                },
              },
            },
          ],
          as: "sessions",
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
          totalTimeTaken: {
            $trunc: { $sum: "$sessions.timeTaken" },
          },
          SurveyDetails: {
            surveyTitle: "$SurveyDetails.title",
            surveyDescription: "$SurveyDetails.description",
          },
        },
      },
    ]);

    res.json({
      totalTime,
      quizzes,
      surveys,
    });
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
        $lookup: {
          from: "users",
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

    // Base URL for constructing the full image path
    const baseUrl =
      process.env.HOST || `${req.protocol}://${req.get("host")}/uploads/`;

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
          originalImageUrl: "$questionDetails.imageUrl",
          correctOption: "$questionDetails.correctAnswer",
          submittedAnswer: "$answer",
          isCorrect: 1,
          timeTaken: 1,
          answerType: 1,
        },
      },
      { $sort: { createdAt: 1 } },
    ]);

    // If you need to verify image existence or get additional image metadata
    const answersWithImages = await Promise.all(
      answers.map(async (answer) => {
        if (answer.originalImageUrl) {
          try {
            const image = await Media.findById(answer.originalImageUrl);
            if (image) {
              const encodedImagePath = encodeURIComponent(
                image.path.split("\\").pop()
              );
              answer.imageUrl = `${baseUrl}${encodedImagePath}`;
            } else {
              answer.imageUrl = null;
            }
          } catch (error) {
            console.error("Error processing image:", error);
            answer.imageUrl = null;
          }
        } else {
          answer.imageUrl = null;
        }
        return answer;
      })
    );

    const sessionReport = await Report.findOne({
      sessionId,
      user: userId,
    }).select("score timeTaken correctAnswers incorrectAnswers");

    // Get session details
    const session = await Session.findById(sessionId)
      .populate("quiz", "title description")
      .populate("host", "username email")
      .select("joinCode status startTime endTime createdAt");

    res.json({
      sessionDetails: session,
      summary: sessionReport,
      answers: answersWithImages,
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

    // Base URL for constructing the full image path
    const baseUrl =
      process.env.HOST || `${req.protocol}://${req.get("host")}/uploads/`;

    const answers = await SurveyAnswer.aggregate([
      {
        $match: {
          surveySession: new mongoose.Types.ObjectId(surveySessionId),
          surveyPlayers: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "surveyquestions",
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
          submittedAnswer: "$surveyAnswer",
          originalImageUrl: "$questionDetails.imageUrl",
          timeTaken: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: 1 } },
    ]);

    // If you need to verify image existence or get additional image metadata
    const answersWithImages = await Promise.all(
      answers.map(async (answer) => {
        if (answer.originalImageUrl) {
          try {
            const image = await Media.findById(answer.originalImageUrl);
            if (image) {
              const encodedImagePath = encodeURIComponent(
                image.path.split("\\").pop()
              );
              answer.imageUrl = `${baseUrl}${encodedImagePath}`;
            } else {
              answer.imageUrl = null;
            }
          } catch (error) {
            console.error("Error processing image:", error);
            answer.imageUrl = null;
          }
        } else {
          answer.imageUrl = null;
        }
        return answer;
      })
    );

    const sessionReport = await Report.findOne({
      surveySessionId,
      user: userId,
    }).select("questionsAttempted questionsSkipped timeTaken");

    // Get session details
    const session = await SurveySession.findById(surveySessionId)
      .populate("surveyQuiz", "title type")
      .populate("surveyHost", "username email")
      .select("surveyJoinCode surveyStatus createdAt startTime endTime");

    res.json({
      sessionDetails: session,
      summary: sessionReport || {},
      answers:answersWithImages,
    });
  } catch (error) {
    console.error("Error fetching survey responses:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get overall analytics for admin dashboard
const getOverallAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalQuizzes,
      totalSurveys,
      totalSessions,
      totalReports,
    ] = await Promise.all([
      User.countDocuments({ isGuest: false }),
      Quiz.countDocuments(),
      SurveyQuiz.countDocuments(),
      Session.countDocuments(),
      Report.countDocuments(),
    ]);

    // Get active sessions count
    const activeSessions = await Session.countDocuments({
      status: "in_progress",
    });

    // Get active survey sessions count
    const activeSurveySessions = await SurveySession.countDocuments({
      surveyStatus: "in_progress",
    });

    // Get user registration trend
    const userTrend = await User.aggregate([
      {
        $match: { isGuest: false },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      overview: {
        totalUsers,
        totalQuizzes,
        totalSurveys,
        totalSessions,
        totalReports,
        activeSessions,
        activeSurveySessions,
      },
      userTrend,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get detailed quiz analytics
const getQuizAnalytics = async (req, res) => {
  try {
    const quizzes = await Report.aggregate([
      {
        $match: { quiz: { $exists: true } },
      },
      {
        $group: {
          _id: "$quiz",
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: "$score" },
          totalParticipants: { $addToSet: "$user" },
          averageTimeTaken: { $avg: "$timeTaken" },
        },
      },
      {
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "_id",
          as: "quizDetails",
        },
      },
      { $unwind: "$quizDetails" },
      {
        $project: {
          quizTitle: "$quizDetails.title",
          totalAttempts: 1,
          averageScore: { $round: ["$averageScore", 2] },
          participantCount: { $size: "$totalParticipants" },
          averageTimeTaken: { $round: ["$averageTimeTaken", 2] },
          status: "$quizDetails.status",
        },
      },
      { $sort: { totalAttempts: -1 } },
    ]);

    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get detailed analytics for a specific quiz
const getQuizDetailedAnalytics = async (req, res) => {
  try {
    const { quizId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID" });
    }

    // Get quiz details with specific fields
    const quiz = await Quiz.findById(quizId)
      .populate("categories", "name")
      .select("title description")
      .lean();

    // Transform categories to array of names only
    if (quiz) {
      quiz.categories = quiz.categories.map((category) => category.name);
    }

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Get overall quiz statistics
    const overallStats = await Leaderboard.aggregate([
      {
        $lookup: {
          from: "sessions",
          localField: "session",
          foreignField: "_id",
          as: "sessionInfo",
        },
      },
      {
        $unwind: "$sessionInfo",
      },
      {
        $match: {
          "sessionInfo.quiz": new mongoose.Types.ObjectId(quizId),
        },
      },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          uniqueParticipants: { $addToSet: "$player" },
          averageScore: { $avg: "$score" },
          highestScore: { $max: "$score" },
          lowestScore: { $min: "$score" },
        },
      },
      {
        $project: {
          _id: 0,
          totalAttempts: 1,
          participantCount: { $size: "$uniqueParticipants" },
          averageScore: { $round: ["$averageScore", 2] },
          highestScore: { $round: ["$highestScore", 2] },
          lowestScore: { $round: ["$lowestScore", 2] },
        },
      },
    ]);

    // Get session details and statistics
    const [sessionStats, sessionList] = await Promise.all([
      Session.aggregate([
        {
          $match: {
            quiz: new mongoose.Types.ObjectId(quizId),
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            averagePlayerCount: { $avg: { $size: "$players" } },
            totalSessions: { $sum: 1 },
          },
        },
        {
          $project: {
            status: "$_id",
            count: 1,
            averagePlayerCount: { $round: ["$averagePlayerCount", 2] },
          },
        },
      ]),
      Session.find({ quiz: quizId })
        .select("joinCode status players startTime endTime createdAt")
        .populate("host", "username email")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Get top performers from leaderboard
    const topPerformers = await Leaderboard.aggregate([
      {
        $lookup: {
          from: "sessions",
          localField: "session",
          foreignField: "_id",
          as: "sessionInfo",
        },
      },
      {
        $unwind: "$sessionInfo",
      },
      {
        $match: {
          "sessionInfo.quiz": new mongoose.Types.ObjectId(quizId),
        },
      },
      {
        $sort: { score: -1 },
      },
      {
        $limit: 3,
      },
      {
        $lookup: {
          from: "users",
          localField: "player",
          foreignField: "_id",
          as: "playerDetails",
        },
      },
      {
        $unwind: "$playerDetails",
      },
      {
        $project: {
          username: "$playerDetails.username",
          score: 1,
          rank: 1,
          createdAt: 1,
        },
      },
    ]);

    // Transform session list to include player count
    const transformedSessionList = sessionList.map((session) => ({
      ...session,
      playerCount: session.players.length,
      players: undefined,
    }));

    res.json({
      quizDetails: quiz,
      overallStats: overallStats[0] || {},
      sessionStats,
      sessionList: transformedSessionList,
      topPerformers,
    });
  } catch (error) {
    console.error("Error fetching quiz analytics:", error);
    res.status(500).json({ message: "Error fetching quiz analytics" });
  }
};

// Get detailed analytics for a specific quiz session
const getQuizSessionAnalytics = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    // Get session details with quiz and host information
    const session = await Session.findById(sessionId)
      .populate("quiz", "title description")
      .populate("host", "username email")
      .select("joinCode status startTime endTime createdAt")
      .lean();

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Get leaderboard data with player response details (username, email, mobile)
    const leaderboardData = await Leaderboard.aggregate([
      {
        $match: {
          session: new mongoose.Types.ObjectId(sessionId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "player",
          foreignField: "_id",
          as: "playerDetails",
        },
      },
      {
        $unwind: "$playerDetails",
      },
      {
        $project: {
          _id: 0,
          player: {
            username: "$playerDetails.username",
            email: "$playerDetails.email",
          },
          score: 1,
          rank: 1,
        },
      },
      {
        $sort: { rank: 1 },
      },
    ]);

    // Get question-wise performance with player responses
    const questionAnalytics = await Answer.aggregate([
      {
        $match: {
          session: new mongoose.Types.ObjectId(sessionId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$question",
          totalAttempts: { $sum: 1 },
          correctAnswers: {
            $sum: { $cond: ["$isCorrect", 1, 0] },
          },
          incorrectAnswers: {
            $sum: { $cond: ["$isCorrect", 0, 1] },
          },
          averageTimeTaken: { $avg: "$timeTaken" },
          responses: {
            $push: {
              answer: "$answer", 
              isCorrect: "$isCorrect",
              username: { $ifNull: ["$userDetails.username", "Anonymous"] },
              email: "$userDetails.email",
              mobile: "$userDetails.mobile",
            },
          },
        },
      },
      {
        $lookup: {
          from: "questions",
          localField: "_id",
          foreignField: "_id",
          as: "questionDetails",
        },
      },
      {
        $unwind: "$questionDetails",
      },
      {
        $project: {
          questionTitle: "$questionDetails.title",
          totalAttempts: 1,
          correctAnswers: 1,
          incorrectAnswers: 1,
          successRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$correctAnswers", "$totalAttempts"] },
                  100,
                ],
              },
              2,
            ],
          },
          averageTimeTaken: { $round: ["$averageTimeTaken", 2] },
          responses: 1, // Return the responses field
        },
      },
      {
        $sort: { successRate: -1 },
      },
    ]);

    // Calculate session statistics
    const sessionStats = await Leaderboard.aggregate([
      {
        $match: {
          session: new mongoose.Types.ObjectId(sessionId),
        },
      },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: 1 },
          averageScore: { $avg: "$score" },
          highestScore: { $max: "$score" },
          lowestScore: { $min: "$score" },
        },
      },
      {
        $project: {
          _id: 0,
          totalParticipants: 1,
          averageScore: { $round: ["$averageScore", 2] },
          highestScore: { $round: ["$highestScore", 2] },
          lowestScore: { $round: ["$lowestScore", 2] },
        },
      },
    ]);

    res.json({
      sessionDetails: session,
      sessionStats: sessionStats[0] || {},
      leaderboard: leaderboardData,
      questionAnalytics,
    });
  } catch (error) {
    console.error("Error fetching quiz session analytics:", error);
    res.status(500).json({ message: "Error fetching quiz session analytics" });
  }
};

// Get detailed survey analytics
const getSurveyAnalytics = async (req, res) => {
  try {
    const surveys = await Report.aggregate([
      {
        $match: { surveyQuiz: { $exists: true } },
      },
      {
        $group: {
          _id: "$surveyQuiz",
          totalResponses: { $sum: 1 },
          averageQuestionsAttempted: { $avg: "$questionsAttempted" },
          totalParticipants: { $addToSet: "$user" },
          averageTimeTaken: { $avg: "$timeTaken" },
        },
      },
      {
        $lookup: {
          from: "surveyquizzes",
          localField: "_id",
          foreignField: "_id",
          as: "surveyDetails",
        },
      },
      { $unwind: "$surveyDetails" },
      {
        $project: {
          surveyTitle: "$surveyDetails.title",
          surveyType: "$surveyDetails.type",
          totalResponses: 1,
          participantCount: { $size: "$totalParticipants" },
          averageQuestionsAttempted: {
            $round: ["$averageQuestionsAttempted", 2],
          },
          averageTimeTaken: { $round: ["$averageTimeTaken", 2] },
          status: "$surveyDetails.status",
        },
      },
      { $sort: { totalResponses: -1 } },
    ]);

    res.json(surveys);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get detailed analytics for a specific survey
const getSurveyDetailedAnalytics = async (req, res) => {
  try {
    const { surveyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
      return res.status(400).json({ message: "Invalid survey ID" });
    }

    // Get survey details with specific fields
    const survey = await SurveyQuiz.findById(surveyId)
      .populate("categories", "name")
      .select("title description type")
      .lean();

    if (survey) {
      survey.categories = survey.categories.map((category) => category.name);
    }

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    // Get overall survey statistics
    const overallStats = await Report.aggregate([
      {
        $match: {
          surveyQuiz: new mongoose.Types.ObjectId(surveyId),
        },
      },
      {
        $group: {
          _id: null,
          totalResponses: { $sum: 1 },
          uniqueParticipants: { $addToSet: "$user" },
          avgQuestionsAttempted: { $avg: "$questionsAttempted" },
          avgQuestionsSkipped: { $avg: "$questionsSkipped" },
          avgTimeTaken: { $avg: "$timeTaken" },
        },
      },
      {
        $project: {
          _id: 0,
          totalResponses: 1,
          participantCount: { $size: "$uniqueParticipants" },
          avgQuestionsAttempted: { $round: ["$avgQuestionsAttempted", 2] },
          avgQuestionsSkipped: { $round: ["$avgQuestionsSkipped", 2] },
          avgTimeTaken: { $round: ["$avgTimeTaken", 2] },
        },
      },
    ]);

    // Get session details and statistics
    const [sessionStats, sessionList] = await Promise.all([
      SurveySession.aggregate([
        {
          $match: {
            surveyQuiz: new mongoose.Types.ObjectId(surveyId),
          },
        },
        {
          $group: {
            _id: "$surveyStatus",
            count: { $sum: 1 },
            averagePlayerCount: { $avg: { $size: "$surveyPlayers" } },
            totalSessions: { $sum: 1 },
          },
        },
        {
          $project: {
            status: "$_id",
            count: 1,
            averagePlayerCount: { $round: ["$averagePlayerCount", 2] },
          },
        },
      ]),
      SurveySession.find({ surveyQuiz: surveyId })
        .select(
          "surveyJoinCode surveyStatus surveyPlayers startTime endTime createdAt"
        )
        .populate("surveyHost", "username email")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    // Transform session list to include player count
    const transformedSessionList = sessionList.map((session) => ({
      ...session,
      playerCount: session.surveyPlayers.length,
      surveyPlayers: undefined,
    }));

    res.json({
      surveyDetails: survey,
      overallStats: overallStats[0] || {},
      sessionStats,
      sessionList: transformedSessionList,
    });
  } catch (error) {
    console.error("Error fetching survey analytics:", error);
    res.status(500).json({ message: "Error fetching survey analytics" });
  }
};

// Get detailed analytics for a specific survey session
const getSurveySessionAnalytics = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }

    // Get session details with survey and host information
    const session = await SurveySession.findById(sessionId)
      .populate("surveyQuiz", "title description type")
      .populate("surveyHost", "username email")
      .select("surveyJoinCode surveyStatus startTime endTime createdAt")
      .lean();

    if (!session) {
      return res.status(404).json({ message: "Survey session not found" });
    }

    // Get participant responses
    const participantResponses = await Report.aggregate([
      {
        $match: {
          surveySessionId: new mongoose.Types.ObjectId(sessionId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          participant: {
            username: "$userDetails.username",
            email: "$userDetails.email",
          },
          questionsAttempted: 1,
          questionsSkipped: 1,
          timeTaken: 1,
          completedAt: 1,
        },
      },
    ]);

    // Get question-wise responses
    const questionAnalytics = await SurveyAnswer.aggregate([
      {
        $match: {
          surveySession: new mongoose.Types.ObjectId(sessionId),
        },
      },
      // Lookup user details from the "users" collection
      {
        $lookup: {
          from: "users",
          localField: "surveyPlayers",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$surveyQuestion",
          totalResponses: { $sum: 1 },
          averageTimeTaken: { $avg: "$timeTaken" },
          responses: {
            $push: {
              answer: "$surveyAnswer",
              username: { $ifNull: ["$userDetails.username", "Anonymous"] },
              email: "$userDetails.email",
              mobile: "$userDetails.mobile",
            },
          },
        },
      },
      {
        $lookup: {
          from: "surveyquestions",
          localField: "_id",
          foreignField: "_id",
          as: "questionDetails",
        },
      },
      {
        $unwind: "$questionDetails",
      },
      {
        $project: {
          questionTitle: "$questionDetails.title",
          description: "$questionDetails.description",
          dimension: "$questionDetails.dimension",
          totalResponses: 1,
          averageTimeTaken: { $round: ["$averageTimeTaken", 2] },
          responses: 1,
        },
      },
    ]);

    // Calculate session statistics
    const sessionStats = await Report.aggregate([
      {
        $match: {
          surveySessionId: new mongoose.Types.ObjectId(sessionId),
        },
      },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: 1 },
          avgQuestionsAttempted: { $avg: "$questionsAttempted" },
          avgQuestionsSkipped: { $avg: "$questionsSkipped" },
          avgTimeTaken: { $avg: "$timeTaken" },
        },
      },
      {
        $project: {
          _id: 0,
          totalParticipants: 1,
          avgQuestionsAttempted: { $round: ["$avgQuestionsAttempted", 2] },
          avgQuestionsSkipped: { $round: ["$avgQuestionsSkipped", 2] },
          avgTimeTaken: { $round: ["$avgTimeTaken", 2] },
        },
      },
    ]);

    res.json({
      sessionDetails: session,
      sessionStats: sessionStats[0] || {},
      participants: participantResponses,
      questionAnalytics,
    });
  } catch (error) {
    console.error("Error fetching survey session analytics:", error);
    res.status(500).json({ message: "Error fetching survey session analytics" });
  }
};

module.exports = {
  getParticipatedQuizzesAndSurveys,
  getQuizAttempts,
  getSurveyAttempts,
  getSessionResponses,
  getSurveyResponses,
  // Admin analytics
  getOverallAnalytics,
  getQuizAnalytics,
  getQuizDetailedAnalytics,
  getQuizSessionAnalytics,
  getSurveyAnalytics,
  getSurveyDetailedAnalytics,
  getSurveySessionAnalytics,
};
