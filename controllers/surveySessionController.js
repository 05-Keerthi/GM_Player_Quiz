const mongoose = require("mongoose");
const QRCode = require("qrcode");
const crypto = require("crypto");
const SurveySession = require("../models/surveysession");
const User = require("../models/User");
const SurveyQuestion = require("../models/surveyQuestion");
const SurveyQuiz = require("../models/surveyQuiz");
const SurveySlide = require("../models/surveySlide");
const Media = require("../models/Media");
const ActivityLog = require("../models/ActivityLog");
const Report = require("../models/Report");
const SurveyAnswer = require("../models/surveyanswer");
const { getFileUrl } = require("../utils/urlHelper");

const updateExpiredWaitingSessions = async (sessionId) => {
  const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);

  try {
    const session = await SurveySession.findOne({
      _id: sessionId,
      surveyStatus: "waiting",
      createdAt: { $lt: eightHoursAgo },
    });

    if (session) {
      session.surveyStatus = "completed";
      await session.save();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error updating expired session:", error);
    return false;
  }
};

exports.createSurveySession = async (req, res) => {
  const { surveyQuizId } = req.params;
  const surveyHostId = req.user._id;

  try {
    // Generate a random join code
    const generateRandomCode = (length = 6) => {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let code = "";
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const surveyJoinCode = generateRandomCode();

    // Create a survey session document without `surveyQrData` for now
    const surveySession = new SurveySession({
      surveyQuiz: surveyQuizId,
      surveyHost: surveyHostId,
      surveyJoinCode,
      surveyStatus: "waiting",
    });

    const savedSurveySession = await surveySession.save();

    // Create a URL that includes the join code
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const joinUrl = `${baseUrl}/joinsurvey?code=${surveyJoinCode}`;

    // const joinUrl = "www.google.com"; // Just for testing

    // Generate QR code as base64 with the join URL
    const surveyQrCodeImageUrl = await QRCode.toDataURL(joinUrl);

    // Update the survey session with QR data
    savedSurveySession.surveyQrData = joinUrl;
    await savedSurveySession.save();

    // Set up a timeout to check and update the session status after 8 hours
    setTimeout(async () => {
      const wasUpdated = await updateExpiredWaitingSessions(
        savedSurveySession._id
      );
      if (wasUpdated) {
        // Emit socket event for status change
        const io = req.app.get("socketio");
        io.emit("survey-session-expired", {
          sessionId: savedSurveySession._id,
          status: "completed",
        });
      }
    }, 8 * 60 * 60 * 1000); // 8 hours

    // Populate the survey session with details
    const populatedSurveySession = await SurveySession.findById(
      savedSurveySession._id
    )
      .populate("surveyPlayers", "username email")
      .populate("surveyHost", "username email")
      .populate("surveyQuiz");

    // Emit socket event
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
  const { isGuest, username, email, mobile } = req.body || {};

  try {
    // Find session and populate references
    let session = await SurveySession.findOne({ surveyJoinCode: joinCode })
      .populate({
        path: "surveyPlayers",
        select: "username email mobile isGuest",
      })
      .populate({
        path: "surveyHost",
        select: "username email",
      })
      .populate({
        path: "surveyQuiz",
        select: "title description categories type slides questions order",
        populate: {
          path: "categories",
          select: "name description",
        },
      })
      .populate("surveyQuestions")
      .populate("surveyCurrentQuestion");

    if (!session) {
      return res.status(404).json({ message: "Survey session not found" });
    }

    if (session.surveyStatus !== "waiting") {
      return res
        .status(400)
        .json({ message: "Session is not open for joining" });
    }

    let user;

    if (isGuest) {
      // Handle guest user
      if (!username || !email || !mobile) {
        return res
          .status(400)
          .json({ message: "All fields are required for guest users" });
      }

      // Check existing user
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() },
          { mobile: mobile.replace(/[^\d]/g, "") },
        ],
      });

      if (existingUser) {
        if (existingUser.isGuest) {
          // Update existing guest user
          existingUser.guestExpiryDate = new Date(
            Date.now() + 24 * 60 * 60 * 1000
          );
          await existingUser.save();
          user = existingUser;
        } else {
          return res
            .status(400)
            .json({ message: "Email or mobile already registered" });
        }
      } else {
        // Create new guest user with role as 'user'
        user = new User({
          username,
          email: email.toLowerCase(),
          mobile: mobile.replace(/[^\d]/g, ""),
          isGuest: true,
          role: "user", // Changed from 'guest' to 'user'
          guestExpiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        await user.save();
      }
    } else {
      // Handle authenticated user
      if (!req.user?._id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      user = await User.findById(req.user._id).select(
        "_id username email mobile role"
      );
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    }

    // Add user to session players
    session.surveyPlayers = session.surveyPlayers || [];
    session.surveyPlayers.push(user._id);
    await session.save();

    // Add participation record to user
    if (!user.surveyParticipations) {
      user.surveyParticipations = [];
    }

    user.surveyParticipations.push({
      sessionId: session._id,
      joinedAt: new Date(),
    });
    await user.save();

    // Refresh session data
    session = await SurveySession.findById(session._id)
      .populate({
        path: "surveyPlayers",
        select: "username email mobile isGuest",
      })
      .populate({
        path: "surveyHost",
        select: "username email",
      })
      .populate({
        path: "surveyQuiz",
        select: "title description categories type slides questions order",
        populate: {
          path: "categories",
          select: "name description",
        },
      })
      .populate("surveyQuestions")
      .populate("surveyCurrentQuestion");

    // Socket emit
    const io = req.app.get("socketio");
    if (io) {
      io.emit("user-joined-survey", {
        sessionId: session._id,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          isGuest: user.isGuest || false,
        },
      });
    }

    // Send response
    res.status(200).json({
      message: "Successfully joined survey session",
      session: {
        _id: session._id,
        surveyJoinCode: session.surveyJoinCode,
        surveyStatus: session.surveyStatus,
        surveyPlayers: session.surveyPlayers.map((player) => ({
          _id: player._id,
          username: player.username,
          email: player.email,
          isGuest: player.isGuest || false,
        })),
        surveyQuiz: {
          title: session.surveyQuiz?.title,
          description: session.surveyQuiz?.description,
          categories: session.surveyQuiz?.categories,
          type: session.surveyQuiz?.type,
          slides: session.surveyQuiz?.slides,
          questions: session.surveyQuiz?.questions,
          order: session.surveyQuiz?.order,
        },
      },
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        isGuest: user.isGuest || false,
      },
    });
  } catch (error) {
    console.error("Error joining survey session:", error);
    res.status(500).json({
      message: "Error joining session",
      error: error.message,
    });
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

    // Transform questions to include full image URLs using getFileUrl utility
    const processedQuestions = questions.map((question) => {
      const questionObj = question.toObject();
      if (questionObj.imageUrl && questionObj.imageUrl.path) {
        const filename = questionObj.imageUrl.path.split(/[\/\\]/).pop();
        questionObj.imageUrl = getFileUrl(filename);
      }
      return questionObj;
    });

    // Transform slides to include full image URLs using getFileUrl utility
    const processedSlides = slides.map((slide) => {
      const slideObj = slide.toObject();
      if (slideObj.imageUrl && slideObj.imageUrl.path) {
        const filename = slideObj.imageUrl.path.split(/[\/\\]/).pop();
        slideObj.imageUrl = getFileUrl(filename);
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

    const currentIndex = session.surveyCurrentQuestion
      ? quiz.order.findIndex(
          (item) =>
            item.id.toString() === session.surveyCurrentQuestion.toString()
        )
      : -1;

    const nextIndex = currentIndex + 1;
    const totalItems = quiz.order.length;

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

    // Update session with current question
    session.surveyCurrentQuestion = nextItem._id;
    await session.save();

    // Process the image URL using getFileUrl utility
    const itemToSend = nextItem.toObject();
    if (itemToSend.imageUrl && itemToSend.imageUrl.path) {
      const filename = itemToSend.imageUrl.path.split(/[\/\\]/).pop();
      itemToSend.imageUrl = getFileUrl(filename);
    }

    // Emit the next item
    const io = req.app.get("socketio");
    io.emit("next-survey-item", {
      type: quiz.order[nextIndex].type,
      item: itemToSend,
      isLastItem: nextIndex === quiz.order.length - 1,
      progress: `${nextIndex + 1}/${totalItems}`,
    });

    res.status(200).json({
      message: "Next item retrieved successfully",
      type: quiz.order[nextIndex].type,
      item: itemToSend,
      isLastItem: nextIndex === quiz.order.length - 1,
      progress: `${nextIndex + 1}/${totalItems}`,
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
      .populate("surveyPlayers", "username email _id mobile")
      .populate("surveyHost", "username email _id mobile")
      .populate("surveyQuiz", "title description")
      .populate("surveyQuestions");

    if (!session) {
      return res.status(404).json({ message: "Survey session not found" });
    }

    // Update session status and end time
    session.surveyStatus = "completed";
    session.endTime = Date.now();
    await session.save();

    // Generate reports and activity logs for each survey player
    const reports = [];
    const activityLogs = [];
    const totalQuestions = session.surveyQuestions.length;

    for (const player of session.surveyPlayers) {
      // Fetch answers submitted by the player for this session
      const answers = await SurveyAnswer.find({
        surveySession: session._id,
        surveyPlayers: player._id,
      });

      // Find skipped questions by comparing submitted answers with all questions
      const skippedQuestions = session.surveyQuestions.filter(
        (question) =>
          !answers.some(
            (answer) =>
              answer.surveyQuestion.toString() === question._id.toString()
          )
      );

      // Create entries for skipped questions
      await Promise.all(
        skippedQuestions.map(async (question) => {
          await SurveyAnswer.create({
            surveySession: session._id,
            surveyPlayers: player._id,
            surveyQuestion: question._id,
            answer: null, // Indicate no answer was provided
            skipped: true,
          });
        })
      );

      const questionsAttempted = answers.length;
      const questionsSkipped = skippedQuestions.length;

      // Create the report for the player
      const reportData = {
        surveyQuiz: session.surveyQuiz._id,
        surveySessionId: session._id,
        user: player._id,
        surveyTotalQuestions: totalQuestions,
        questionsAttempted,
        questionsSkipped,
        completedAt: Date.now(),
      };

      const report = new Report(reportData);
      await report.save();
      reports.push(report);

      // Create an activity log for the player with detailed information
      const activityLog = await ActivityLog.create({
        user: player._id,
        activityType: "survey_play",
        details: {
          sessionId,
          username: player.username,
          email: player.email,
          mobile: player.mobile,
          surveyTitle: session.surveyQuiz.title,
          surveyDescription: session.surveyQuiz.description,
          questionsAttempted,
          questionsSkipped,
          totalQuestions,
          completionTime: session.endTime,
        },
      });
      activityLogs.push(activityLog);
    }

    // Emit the session end event with complete data
    const io = req.app.get("socketio");
    io.emit("survey-session-ended", {
      session,
      reports,
      activityLogs,
    });

    // Respond with the session, reports, and activity logs
    res.status(200).json({
      message: "Survey session ended successfully",
      session,
      reports,
      activityLogs,
    });
  } catch (error) {
    console.error("End survey session error:", error);
    res.status(500).json({
      message: "Error ending the survey session",
      error: error.message,
    });
  }
};
