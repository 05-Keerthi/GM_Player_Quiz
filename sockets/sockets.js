const Answer = require("../models/answer");
const Question = require("../models/question");
const Session = require("../models/session");
const mongoose = require("mongoose");
const surveySession = require("../models/surveysession");

module.exports = (io) => {
  const userSockets = new Map();

  const emitCurrentPlayers = async (sessionId, socket) => {
    try {
      const session = await Session.findById(sessionId).populate(
        "players",
        "username email"
      );

      if (session) {
        socket.emit("current-players", session.players || []);
      }
    } catch (error) {
      console.error("Error fetching current players:", error);
    }
  };

  const emitCurrentSurveyPlayers = async (sessionId, socket) => {
    try {
      const session = await surveySession
        .findById(sessionId)
        .populate("surveyPlayers", "username email isGuest");

      if (session) {
        socket.emit("current-survey-players", session.surveyPlayers || []);
      }
    } catch (error) {
      console.error("Error fetching current survey players:", error);
    }
  };

  io.on("connection", (socket) => {
    // ==================== QUIZ SOCKET HANDLERS ====================

    // Quiz Session Management

    socket.on("get-current-players", async ({ sessionId }) => {
      await emitCurrentPlayers(sessionId, socket);
    });

    socket.on("join-session", async ({ sessionId, userId, username }) => {
      try {
        console.log("Join session request received:", {
          sessionId,
          userId,
          username,
        });

        if (!sessionId || !userId || !username) {
          throw new Error("Missing required fields");
        }

        if (
          !mongoose.Types.ObjectId.isValid(sessionId) ||
          !mongoose.Types.ObjectId.isValid(userId)
        ) {
          throw new Error("Invalid ID format");
        }

        socket.join(sessionId);

        const userData = {
          userId: userId.toString(),
          sessionId: sessionId.toString(),
          username,
        };

        socket.userData = userData;
        userSockets.set(socket.id, userData);

        const updatedSession = await Session.findByIdAndUpdate(
          sessionId,
          { $addToSet: { players: userId } },
          { new: true }
        ).populate("players", "username email");

        if (!updatedSession) {
          throw new Error("Session not found");
        }

        // Emit updated player list to all clients in the session
        io.to(sessionId).emit("current-players", updatedSession.players || []);

        io.to(sessionId).emit("user-joined", {
          message: "A new user has joined the session.",
          userId,
          username,
        });
      } catch (error) {
        console.error("Error in join-session:", error);
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("create-session", async ({ sessionId }) => {
      try {
        socket.join(sessionId);

        // Fetch and emit initial player list
        await emitCurrentPlayers(sessionId, socket);

        io.to(sessionId).emit("session-created", { sessionId });
      } catch (error) {
        console.error("Error in create-session:", error);
      }
    });

    // Quiz Question Management
    socket.on(
      "next-item",
      ({ sessionId, type, item, isLastItem, progress }) => {
        io.to(sessionId).emit("next-item", {
          type,
          item,
          isLastItem,
          progress,
        });
      }
    );

    // Quiz Timer
    socket.on("timer-sync", ({ sessionId, timeLeft }) => {
      io.to(sessionId).emit("timer-sync", { timeLeft });
    });

    // Quiz Answer Management
    socket.on("answer-submitted", async ({ sessionId, answerDetails }) => {
      try {
        io.to(sessionId).emit("answer-submitted", { answerDetails });

        if (answerDetails.questionId) {
          const answers = await Answer.find({
            session: sessionId,
            question: answerDetails.questionId,
          });

          const question = await Question.findById(answerDetails.questionId);
          if (question && question.options) {
            const optionCounts = {};
            question.options.forEach((option, index) => {
              const letter = String.fromCharCode(65 + index);
              optionCounts[letter] = answers.filter(
                (a) => a.answer === option.text
              ).length;
            });

            io.to(sessionId).emit("answer-counts-updated", {
              questionId: answerDetails.questionId,
              counts: optionCounts,
            });
          }
        }
      } catch (error) {
        console.error("Error handling answer submission:", error);
      }
    });

    // Quiz Completion
    socket.on("quiz-completed", ({ sessionId }) => {
      io.to(sessionId).emit("quiz-completed", {
        message: "Quiz has been completed",
      });
    });

    // Quiz Session End
    socket.on("end-session", ({ sessionId }) => {
      try {
        io.to(sessionId).emit("session-ended", {
          message: "Session has ended",
        });
        io.to(sessionId).emit("quiz-completed", {
          message: "Quiz has been completed",
        });
        io.in(sessionId).socketsLeave(sessionId);
      } catch (error) {
        console.error("Error ending session:", error);
      }
    });

    // ==================== SURVEY SOCKET HANDLERS ====================

    socket.on("get-current-survey-players", async ({ sessionId }) => {
      await emitCurrentSurveyPlayers(sessionId, socket);
    });

    
    socket.on("create-survey-session", async ({ sessionId }) => {
      try {
        socket.join(sessionId);

        // Fetch and emit initial survey player list
        await emitCurrentSurveyPlayers(sessionId, socket);

        io.to(sessionId).emit("survey-session-created", { sessionId });
      } catch (error) {
        console.error("Error in create-survey-session:", error);
      }
    });

    socket.on(
      "join-survey-session",
      async ({ sessionId, userId, username, isGuest }) => {
        try {
          console.log("Join survey session request received:", {
            sessionId,
            userId,
            username,
            isGuest,
          });

          if (!sessionId || !userId || !username) {
            throw new Error("Missing required fields");
          }

          if (
            !mongoose.Types.ObjectId.isValid(sessionId) ||
            !mongoose.Types.ObjectId.isValid(userId)
          ) {
            throw new Error("Invalid ID format");
          }

          socket.join(sessionId);

          const userData = {
            userId: userId.toString(),
            sessionId: sessionId.toString(),
            username,
            isGuest,
          };

          socket.userData = userData;
          userSockets.set(socket.id, userData);

          const updatedSession = await surveySession
            .findByIdAndUpdate(
              sessionId,
              { $addToSet: { surveyPlayers: userId } },
              { new: true }
            )
            .populate("surveyPlayers", "username email isGuest");

          if (!updatedSession) {
            throw new Error("Survey session not found");
          }

          // Emit updated player list to all clients in the session
          io.to(sessionId).emit(
            "current-survey-players",
            updatedSession.surveyPlayers || []
          );

          io.to(sessionId).emit("user-joined-survey", {
            message: "A new user has joined the survey session.",
            userId,
            username,
            isGuest,
          });
        } catch (error) {
          console.error("Error in join-survey-session:", error);
          socket.emit("error", { message: error.message });
        }
      }
    );

    // Survey Content Management
    socket.on(
      "next-survey-question",
      ({ sessionId, type, item, isLastItem, initialTime, progress }) => {
        io.to(sessionId).emit("next-survey-question", {
          type,
          question: item,
          isLastQuestion: isLastItem,
          initialTime: initialTime || 30,
          progress,
        });
      }
    );

    // Timer Management
    socket.on("survey-timer-sync", ({ sessionId, timeLeft }) => {
      io.to(sessionId).emit("timer-sync", { timeLeft });
    });

    // Answer Management
    socket.on(
      "survey-submit-answer",
      ({ sessionId, questionId, userId, answer, timeTaken, isGuest }) => {
        // Emit to admin for tracking
        io.to(sessionId).emit("survey-answer-submitted", {
          questionId,
          userId,
          answer,
          timeTaken,
          isGuest,
        });

        // Confirm back to user
        socket.emit("answer-submission-confirmed", {
          status: "success",
          questionId,
        });
      }
    );

    // Survey Completion
    socket.on("survey-completed", ({ sessionId }) => {
      setTimeout(() => {
        io.to(sessionId).emit("survey-completed", {
          message: "Survey has been completed",
        });
      }, 1000);
    });

    // Survey Session End
    socket.on("end-survey-session", ({ sessionId }) => {
      try {
        io.to(sessionId).emit("survey-session-ended", {
          message: "Survey session has ended",
        });
        io.in(sessionId).socketsLeave(sessionId);
      } catch (error) {
        console.error("Error ending survey session:", error);
      }
    });
    // ==================== COMMON HANDLERS ====================

    // Notifications
    socket.on("send-notification", ({ sessionId, notification }) => {
      if (sessionId && notification) {
        io.to(sessionId).emit("receive-notification", notification);
      }
    });

    // Disconnection

    socket.on("disconnect", async () => {
      try {
        const userData = userSockets.get(socket.id) || socket.userData;
    
        if (!userData || !userData.userId || !userData.sessionId) {
          return;
        }
    
        const { userId, sessionId } = userData;
    
        if (
          !mongoose.Types.ObjectId.isValid(sessionId) ||
          !mongoose.Types.ObjectId.isValid(userId)
        ) {
          throw new Error("Invalid ID format in stored user data");
        }
    
        // Check quiz session
        const quizSession = await Session.findById(sessionId);
        if (quizSession && quizSession.status === 'waiting') {
          const updatedQuizSession = await Session.findOneAndUpdate(
            { _id: sessionId },
            { $pull: { players: userId } },
            { new: true }
          ).populate("players", "username email");
    
          if (updatedQuizSession) {
            io.to(sessionId).emit(
              "current-players",
              updatedQuizSession.players || []
            );
          }
        }
    
        // Check survey session
        const surveySessionDoc = await surveySession.findById(sessionId);
        if (surveySessionDoc && surveySessionDoc.surveyStatus === 'waiting') {
          const updatedSurveySession = await surveySession
            .findOneAndUpdate(
              { _id: sessionId },
              { $pull: { surveyPlayers: userId } },
              { new: true }
            )
            .populate("surveyPlayers", "username email isGuest");
    
          if (updatedSurveySession) {
            io.to(sessionId).emit(
              "current-survey-players",
              updatedSurveySession.surveyPlayers || []
            );
          }
        }
    
        userSockets.delete(socket.id);
    
        io.to(sessionId).emit("user-disconnected", {
          userId,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error in disconnect handler:", error);
      }
    });
  });
};
