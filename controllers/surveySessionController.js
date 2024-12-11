const mongoose = require("mongoose");
const QRCode = require("qrcode");
const crypto = require("crypto");
const SurveySession = require("../models/surveysession");

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