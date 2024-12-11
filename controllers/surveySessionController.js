const mongoose = require("mongoose");
const QRCode = require("qrcode");
const crypto = require("crypto");
const SurveySession = require("../models/surveysession");
const User = require("../models/User");
const SurveyQuestion = require('../models/surveyQuestion'); 
const Media = require('../models/Media');

exports.createSurveySession = async (req, res) => {
  const { surveyQuizId } = req.params; // Survey quiz ID from the request params
  const surveyHostId= req.user._id; // Assume req.user contains authenticated user information

  try {
    // Generate a random join code
    const surveyJoinCode = crypto.randomInt(100000, 999999).toString();

    // Create a survey session document without `surveyQrData` for now
    const surveySession = new SurveySession({
      surveyQuiz: surveyQuizId,
      surveyHost: surveyHostId,
      surveyJoinCode,
      surveyStatus: "waiting",
    });

    const savedSurveySession = await surveySession.save();

    // Construct the QR data using the session ID and join code
    const surveyQrData = `${req.protocol}://${req.get("host")}/api/survey-sessions/${surveyJoinCode}/${savedSurveySession._id}/join`;

    // Generate QR code as base64
    const surveyQrCodeImageUrl = await QRCode.toDataURL(surveyQrData);

    // Update the survey session with QR data
    savedSurveySession.surveyQrData = surveyQrData;
    await savedSurveySession.save();

    // Populate the survey session with details
    const populatedSurveySession = await SurveySession.findById(savedSurveySession._id)
      .populate("surveyPlayers", "username email")
      .populate("surveyHost", "username email")
      .populate("surveyQuiz");

    // Emit a socket event for session creation (if applicable)
    const io = req.app.get("socketio");
    io.emit("create-survey-session", {
      sessionId: populatedSurveySession._id,
      joinCode: populatedSurveySession.surveyJoinCode,
    });

    res.status(201).json({
      _id: populatedSurveySession._id,
      surveyQuiz: populatedSurveySession.surveyQuiz,
      surveyHost: populatedSurveySession.surveyHost,
      surveyJoinCode: populatedSurveySession.surveyJoinCode,
      surveyQrData: populatedSurveySession.surveyQrData,
      surveyQrCodeImageUrl,
      surveyStatus: populatedSurveySession.surveyStatus,
      surveyPlayers: populatedSurveySession.surveyPlayers,
      createdAt: populatedSurveySession.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating the survey session", error });
  }
};

exports.joinSurveySession = async (req, res) => {
    const { joinCode } = req.params;
    const userId = req.user._id;
  
    try {
      // Find the session using the join code
      let session = await SurveySession.findOne({ surveyJoinCode: joinCode })
        .populate('surveyPlayers', 'username email')
        .populate('surveyHost', 'username email')
        .populate('surveyQuiz');
  
      if (!session) {
        return res.status(404).json({ message: 'Survey session not found' });
      }
  
      // Check if the session is open for joining
      if (session.surveyStatus !== 'waiting') {
        return res.status(400).json({ message: 'Survey session is not open for joining' });
      }
  
      // Check if the user has already joined the session
      if (session.surveyPlayers.some((player) => player._id.toString() === userId.toString())) {
        return res.status(400).json({ message: 'User has already joined this session' });
      }
  
      // Get user details
      const user = await User.findById(userId).select('username email');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Add the user to the session's players
      session.surveyPlayers.push(userId);
      await session.save();
  
      // Refresh the populated session
      session = await SurveySession.findById(session._id)
        .populate('surveyPlayers', 'username email')
        .populate('surveyHost', 'username email')
        .populate('surveyQuiz');
  
      // Emit the join event using socket.io
      const io = req.app.get('socketio');
      io.emit('player-joined-survey', { sessionId: session._id, user });
  
      res.status(200).json({
        message: 'User successfully joined the survey session',
        session,
      });
    } catch (error) {
      console.error('Error joining survey session:', error);
      res.status(500).json({ message: 'Error joining survey session', error });
    }
  };

exports.startSurveySession = async (req, res) => {
  const { joinCode, sessionId } = req.params;

  try {
    // Fetch the session with explicit checks
    const session = await SurveySession.findOne({
      _id: sessionId,
      surveyJoinCode: joinCode,
    })
      .populate("surveyQuiz")
      .populate("surveyPlayers", "username email")
      .populate("surveyHost", "username email");

    console.log("Fetched session:", session); // Log for debugging

    if (!session) {
      return res.status(404).json({ message: "Survey session not found" });
    }

    if (session.surveyStatus !== "waiting") {
      return res.status(400).json({ message: `Current status is '${session.surveyStatus}'` });
    }

    const questions = await SurveyQuestion.find({ _id: { $in: session.surveyQuiz.questions } });

    session.surveyStatus = "in_progress";
    session.surveyQuestions = questions.map((q) => q._id);
    session.startTime = new Date();
    await session.save();

    const baseUrl = `${req.protocol}://${req.get("host")}/`;

    const questionsWithImageUrls = await Promise.all(
      questions.map(async (question) => {
        let fullImageUrl = null;
        if (question.imageUrl) {
          const media = await Media.findById(question.imageUrl);
          if (media && media.path) {
            const encodedPath = media.path.replace(/ /g, "%20").replace(/\\/g, "/");
            fullImageUrl = `${baseUrl}${encodedPath}`;
          }
        }
        return {
          ...question.toObject(),
          imageUrl: fullImageUrl,
        };
      })
    );

    const io = req.app.get("socketio");
    io.emit("survey-session-started", {
      session,
      questions: questionsWithImageUrls,
    });

    res.status(200).json({
      message: "Survey session started successfully",
      session,
      questions: questionsWithImageUrls,
    });
  } catch (error) {
    console.error("Start survey session error:", error);
    res.status(500).json({ message: "Error starting the survey session", error });
  }
};
