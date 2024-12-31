<<<<<<< HEAD
const Session = require("../models/session");
const Quiz = require("../models/quiz");
const Question = require("../models/question");
const QRCode = require("qrcode");
const crypto = require("crypto");
const Media = require("../models/Media");
const Slide = require("../models/slide");
=======
const Session = require('../models/session');
const Quiz = require('../models/quiz');
const Question = require('../models/question');
const QRCode = require('qrcode');
const crypto = require('crypto');
const Media = require('../models/Media');
const Slide = require('../models/slide'); 
>>>>>>> 7d8636dca3bcc12b92092d6e871edbfa13ca1534
const User = require("../models/User");
const Report = require("../models/Report");
const Answer = require("../models/answer");
const Leaderboard = require("../models/leaderBoard");
const ActivityLog = require("../models/ActivityLog");

// create a new session for quiz
exports.createSession = async (req, res) => {
  const { quizId } = req.params;
  const hostId = req.user._id;

  try {
    // Generate a random join code
    const joinCode = crypto.randomInt(100000, 999999).toString();

    // Create a session document without `qrData` for now
    const session = new Session({
      quiz: quizId,
      host: hostId,
      joinCode,
      status: "waiting",
    });

    const savedSession = await session.save();

    // Now construct qrData using the session ID
    const qrData = `${req.protocol}://${req.get(
      "host"
    )}/api/sessions/${joinCode}/${savedSession._id}/join`;

    // Generate QR code as base64
    const qrCodeImageUrl = await QRCode.toDataURL(qrData);

    // Update the session with qrData
    savedSession.qrData = qrData;
    await savedSession.save();

    // Populate the session with player details
    const populatedSession = await Session.findById(savedSession._id)
      .populate("players", "username email")
      .populate("host", "username email")
      .populate("quiz");

    // Emit the socket event
    const io = req.app.get("socketio");
    io.emit("create-session", {
      sessionId: populatedSession._id,
      joinCode: populatedSession.joinCode,
    });

    res.status(201).json({
      _id: populatedSession._id,
      quiz: populatedSession.quiz,
      host: populatedSession.host,
      joinCode: populatedSession.joinCode,
      qrData: populatedSession.qrData,
      qrCodeImageUrl,
      status: populatedSession.status,
      players: populatedSession.players,
      createdAt: populatedSession.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating the session", error });
  }
};

// join a session(user)
exports.joinSession = async (req, res) => {
  const { joinCode } = req.params;
  const userId = req.user._id;

  try {
    // Find the session using joinCode
    let session = await Session.findOne({ joinCode })
      .populate("players", "username email")
      .populate("host", "username email");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if the session is open for joining
    if (session.status !== "waiting") {
      return res
        .status(400)
        .json({ message: "Session is not open for joining" });
    }

    // Check if the user has already joined the session
    if (
      session.players.some(
        (player) => player._id.toString() === userId.toString()
      )
    ) {
      return res
        .status(400)
        .json({ message: "User has already joined the session" });
    }

    // Get user details
    const user = await User.findById(userId).select("username email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add the user to the session's players
    session.players.push(userId);
    await session.save();

    // Refresh the populated session
    session = await Session.findById(session._id)
      .populate("players", "username email")
      .populate("host", "username email");

    // Emit the join event with full user details
    const io = req.app.get("socketio");
    io.emit("player-joined", { user }); // Emit to all connected clients

    res.status(200).json({
      message: "User successfully joined the session",
      session,
    });
  } catch (error) {
    console.error("Join session error:", error);
    res.status(500).json({ message: "Error joining the session", error });
  }
};
// start the session
exports.startSession = async (req, res) => {
  const { joinCode, sessionId } = req.params;

  try {
    const session = await Session.findOne({
      joinCode,
      _id: sessionId,
    }).populate("quiz");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "waiting") {
      return res.status(400).json({ message: "Session cannot be started" });
    }

    // Fetch questions and slides with populated imageUrl
    const questions = await Question.find({
      _id: { $in: session.quiz.questions },
    }).populate("imageUrl", "path");
    const slides = await Slide.find({
      _id: { $in: session.quiz.slides },
    }).populate("imageUrl", "path");

    session.status = "in_progress";
    session.questions = questions.map((q) => q._id);
    session.slides = slides.map((s) => s._id);
    session.startTime = Date.now();
    await session.save();

    // Transform questions to include full image URLs
    const baseUrl =
      process.env.HOST || `${req.protocol}://${req.get("host")}/uploads/`;

    const processedQuestions = questions.map((question) => {
      const questionObj = question.toObject();
      if (questionObj.imageUrl && questionObj.imageUrl.path) {
        const encodedImagePath = encodeURIComponent(
          questionObj.imageUrl.path.split("\\").pop()
        );
        questionObj.imageUrl = `${baseUrl}${encodedImagePath}`;
      }
      return questionObj;
    });

    // Transform slides to include full image URLs
    const processedSlides = slides.map((slide) => {
      const slideObj = slide.toObject();
      if (slideObj.imageUrl && slideObj.imageUrl.path) {
        const encodedImagePath = encodeURIComponent(
          slideObj.imageUrl.path.split("\\").pop()
        );
        slideObj.imageUrl = `${baseUrl}${encodedImagePath}`;
      }
      return slideObj;
    });

    // Emit the session start event
    const io = req.app.get("socketio");
    io.emit("session-started", {
      session,
      questions: processedQuestions,
      slides: processedSlides,
    });

    res.status(200).json({
      message: "Session started successfully",
      session,
      questions: processedQuestions,
      slides: processedSlides,
    });
  } catch (error) {
    console.error("Start session error:", error);
    res.status(500).json({ message: "Error starting the session", error });
  }
};


exports.nextQuestion = async (req, res) => {
  const { joinCode, sessionId } = req.params;

  try {
    const session = await Session.findOne({ joinCode, _id: sessionId })
      .populate("quiz")
      .populate("players", "username email")
      .populate("host", "username email");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "in_progress") {
      return res.status(400).json({ message: "Session is not in progress" });
    }

    const quiz = await Quiz.findById(session.quiz._id)
      .populate({
        path: "questions",
        populate: { path: "imageUrl", select: "path" },
      })
      .populate({
        path: "slides",
        populate: { path: "imageUrl", select: "path" },
      });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Get current index and determine next item
    const currentIndex = session.currentQuestion
      ? quiz.order.findIndex(
          (item) => item.id.toString() === session.currentQuestion.toString()
        )
      : -1;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= quiz.order.length) {
      return res
        .status(400)
        .json({ message: "No more items left in the session" });
    }

    const nextItemId = quiz.order[nextIndex].id;
    const nextItem =
      quiz.questions.find((q) => q._id.toString() === nextItemId.toString()) ||
      quiz.slides.find((s) => s._id.toString() === nextItemId.toString());

    if (!nextItem) {
      return res
        .status(404)
        .json({ message: "Next item not found in the quiz" });
    }

    // Update session with current question
    session.currentQuestion = nextItem._id;
    await session.save();

    // Process the image URL
    const baseUrl =
      process.env.HOST || `${req.protocol}://${req.get("host")}/uploads/`;
    const itemToSend = nextItem.toObject();

    if (itemToSend.imageUrl && itemToSend.imageUrl.path) {
      const encodedImagePath = encodeURIComponent(
        itemToSend.imageUrl.path.split("\\").pop()
      );
      itemToSend.imageUrl = `${baseUrl}${encodedImagePath}`;
    }

    // Emit the next item
    const io = req.app.get("socketio");
    io.emit("next-item", {
      type: quiz.order[nextIndex].type,
      item: itemToSend,
      isLastItem: nextIndex === quiz.order.length - 1,
    });

    res.status(200).json({
      message: "Next item retrieved successfully",
      type: quiz.order[nextIndex].type,
      item: itemToSend,
      isLastItem: nextIndex === quiz.order.length - 1,
    });
  } catch (error) {
    console.error("Next question error:", error);
    res.status(500).json({ message: "Error retrieving the next item", error });
  }
};

exports.endSession = async (req, res) => {
  const { joinCode, sessionId } = req.params;

  try {
    // Find the session
    const session = await Session.findOne({ joinCode, _id: sessionId })
      .populate("players", "username email")
      .populate("host", "username email")
      .populate("quiz", "title description");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Update session status
    session.status = "completed";
    session.endTime = Date.now();
    await session.save();

    const { title: quizTitle, description: quizDescription } = session.quiz;

    // Fetch all leaderboard scores for this session
    const leaderboardEntries = await Leaderboard.find({
      session: sessionId,
    }).sort({ score: -1 });

    // Map user IDs to ranks
    const rankMap = leaderboardEntries.reduce((map, entry, index) => {
      map[entry.player.toString()] = index + 1; // Rank starts at 1
      return map;
    }, {});

    const reports = [];
    const activityLogs = [];

    for (const player of session.players) {
      const userId = player._id;
      const username = player.username;

      const leaderboardEntry = leaderboardEntries.find(
        (entry) => entry.player.toString() === userId.toString()
      );
      const leaderboardScore = leaderboardEntry ? leaderboardEntry.score : 0;
      const rank = rankMap[userId.toString()] || null;

      const totalQuestions = await Answer.countDocuments({
        session: sessionId,
        user: userId,
      });
      const correctAnswers = await Answer.countDocuments({
        session: sessionId,
        user: userId,
        isCorrect: true,
      });
      const incorrectAnswers = totalQuestions - correctAnswers;

      // Save report
      const report = await Report.create({
        quiz: session.quiz,
        user: userId,
        sessionId,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        totalScore: leaderboardScore,
        completedAt: session.endTime,
      });

      reports.push(report);

      // Save activity log with rank
      const activityLog = await ActivityLog.create({
        user: userId,
        activityType: "quiz_play",
        details: {
          sessionId,
          username,
          quizTitle,
          quizDescription,
          rank,
          correctAnswers,
          incorrectAnswers,
          totalScore: leaderboardScore,
        },
      });

      activityLogs.push(activityLog);
    }

    // Emit socket event
    const io = req.app.get("socketio");
    io.emit("session-ended", { session });

    // Respond with success
    res.status(200).json({
      message: "Session ended successfully and reports generated",
      session,
      reports,
      activityLogs,
    });
  } catch (error) {
    console.error("End session error:", error);
    res.status(500).json({
      message: "Error ending the session and generating reports",
      error,
    });
  }
};
