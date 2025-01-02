const mongoose = require("mongoose");
const QRCode = require("qrcode");
const crypto = require("crypto");
const SurveySession = require("../models/surveysession");
const User = require("../models/User");
const SurveyQuestion = require("../models/surveyQuestion");
const SurveyQuiz = require("../models/surveyQuiz");
const SurveySlide = require("../models/surveySlide");
const Media = require("../models/Media");

exports.createSurveySession = async (req, res) => {
  const { surveyQuizId } = req.params; // Survey quiz ID from the request params
  const surveyHostId = req.user._id; // Assume req.user contains authenticated user information

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
    const surveyQrData = `${req.protocol}://${req.get(
      "host"
    )}/api/survey-sessions/${surveyJoinCode}/${savedSurveySession._id}/join`;

    // Generate QR code as base64
    const surveyQrCodeImageUrl = await QRCode.toDataURL(surveyQrData);

    // Update the survey session with QR data
    savedSurveySession.surveyQrData = surveyQrData;
    await savedSurveySession.save();

    // Populate the survey session with details
    const populatedSurveySession = await SurveySession.findById(
      savedSurveySession._id
    )
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
    res
      .status(500)
      .json({ message: "Error creating the survey session", error });
  }
};

exports.joinSurveySession = async (req, res) => {
  const { joinCode } = req.params;
  const userId = req.user._id;

  try {
    // Find the session using the join code
    let session = await SurveySession.findOne({ surveyJoinCode: joinCode })
      .populate("surveyPlayers", "username email")
      .populate("surveyHost", "username email")
      .populate("surveyQuiz");

    if (!session) {
      return res.status(404).json({ message: "Survey session not found" });
    }

    // Check if the session is open for joining
    if (session.surveyStatus !== "waiting") {
      return res
        .status(400)
        .json({ message: "Survey session is not open for joining" });
    }

    // Check if the user has already joined the session
    if (
      session.surveyPlayers.some(
        (player) => player._id.toString() === userId.toString()
      )
    ) {
      return res
        .status(400)
        .json({ message: "User has already joined this session" });
    }

    // Get user details with specific fields
    const user = await User.findById(userId).select("_id username email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add the user to the session's players
    session.surveyPlayers.push(userId);
    await session.save();

    // Refresh the populated session
    session = await SurveySession.findById(session._id)
      .populate("surveyPlayers", "username email")
      .populate("surveyHost", "username email")
      .populate("surveyQuiz");

    // Emit the join event using socket.io with full user details
    const io = req.app.get("socketio");
    io.emit("user-joined-survey", {
      sessionId: session._id,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });

    res.status(200).json({
      message: "User successfully joined the survey session",
      session,
    });
  } catch (error) {
    console.error("Error joining survey session:", error);
    res.status(500).json({ message: "Error joining survey session", error });
  }
};

exports.startSurveySession = async (req, res) => {
  const { joinCode, sessionId } = req.params;

  try {
    const session = await SurveySession.findOne({
      surveyJoinCode: joinCode,
      _id: sessionId,
    }).populate("surveyQuiz");

    if (!session) {
      return res.status(404).json({ message: "Survey session not found" });
    }

    if (session.surveyStatus !== "waiting") {
      return res
        .status(400)
        .json({ message: "Survey session cannot be started" });
    }

    // Fetch questions and slides with populated imageUrl
    const questions = await SurveyQuestion.find({
      _id: { $in: session.surveyQuiz.questions },
    }).populate("imageUrl", "path");
    const slides = await SurveySlide.find({
      _id: { $in: session.surveyQuiz.slides },
    }).populate("imageUrl", "path");

    session.surveyStatus = "in_progress";
    session.surveyQuestions = questions.map((q) => q._id);
    session.surveySlides = slides.map((s) => s._id);
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
    io.emit("survey-session-started", {
      session,
      questions: processedQuestions,
      slides: processedSlides,
    });

    res.status(200).json({
      message: "Survey session started successfully",
      session,
      questions: processedQuestions,
      slides: processedSlides,
    });
  } catch (error) {
    console.error("Start survey session error:", error);
    res
      .status(500)
      .json({ message: "Error starting the survey session", error });
  }
};

exports.nextSurveyQuestion = async (req, res) => {
  const { joinCode, sessionId } = req.params;

  try {
    // Find the survey session
    const session = await SurveySession.findOne({
      surveyJoinCode: joinCode,
      _id: sessionId,
    })
      .populate("surveyQuiz")
      .populate("surveyPlayers", "username email")
      .populate("surveyHost", "username email");

    if (!session) {
      return res.status(404).json({ message: "Survey session not found" });
    }

    if (session.surveyStatus !== "in_progress") {
      return res
        .status(400)
        .json({ message: "Survey session is not in progress" });
    }

    // Retrieve the quiz associated with the session
    const quiz = await SurveyQuiz.findById(session.surveyQuiz)
      .populate({
        path: "questions",
        populate: { path: "imageUrl", select: "path" },
      })
      .populate({
        path: "slides",
        populate: { path: "imageUrl", select: "path" },
      });

    if (!quiz) {
      return res.status(404).json({ message: "Survey quiz not found" });
    }

    // Get the current index and determine the next item
    const currentIndex = session.surveyCurrentQuestion
      ? quiz.order.findIndex(
          (item) =>
            item.id.toString() === session.surveyCurrentQuestion.toString()
        )
      : -1;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= quiz.order.length) {
      return res
        .status(400)
        .json({ message: "No more items left in the survey session" });
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

    // Update session with the current content item
    session.surveyCurrentQuestion = nextItem._id;
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
    io.emit("next-survey-item", {
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
    console.error("Next survey question error:", error);
    res.status(500).json({ message: "Error retrieving the next item", error });
  }
};

exports.endSurveySession = async (req, res) => {
  const { joinCode, sessionId } = req.params;

  try {
    // Find the survey session
    const session = await SurveySession.findOne({
      surveyJoinCode: joinCode,
      _id: sessionId,
    })
      .populate("surveyPlayers", "username email")
      .populate("surveyHost", "username email");

    if (!session) {
      return res.status(404).json({ message: "Survey session not found" });
    }

    // Update session status and end time
    session.surveyStatus = "completed";
    session.endTime = Date.now();
    await session.save();

    // Emit the session end event
    const io = req.app.get("socketio");
    io.emit("survey-session-ended", { session });

    // Respond with the updated session
    res
      .status(200)
      .json({ message: "Survey session ended successfully", session });
  } catch (error) {
    console.error("End survey session error:", error);
    res.status(500).json({ message: "Error ending the survey session", error });
  }
};
