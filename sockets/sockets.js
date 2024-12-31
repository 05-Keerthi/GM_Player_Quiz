const Answer = require("../models/answer");
const Question = require("../models/question");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // ==================== QUIZ SOCKET HANDLERS ====================

    // Quiz Session Management
    socket.on("join-session", async ({ sessionId, userId, username }) => {
      try {
        socket.join(sessionId);
        console.log(`Socket ${socket.id} joined room ${sessionId}`);
        io.to(sessionId).emit("user-joined", {
          message: "A new user has joined the session.",
          userId,
          username,
        });
      } catch (error) {
        console.error("Error joining session:", error);
      }
    });

    socket.on("create-session", ({ sessionId }) => {
      socket.join(sessionId);
      console.log(`Session created: ${sessionId}, by Socket: ${socket.id}`);
      io.to(sessionId).emit("session-created", { sessionId });
    });

    // Quiz Question Management
    socket.on("next-item", ({ sessionId, type, item, isLastItem }) => {
      io.to(sessionId).emit("next-item", {
        type,
        item,
        isLastItem,
      });
    });

    // Quiz Timer
    socket.on("timer-sync", ({ sessionId, timeLeft }) => {
      io.to(sessionId).emit("timer-sync", { timeLeft });
    });

    // Quiz Answer Management
    socket.on("answer-submitted", async ({ sessionId, answerDetails }) => {
      try {
        console.log("Answer submitted:", { sessionId, answerDetails });
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

    // Survey Session Management
    socket.on("create-survey-session", ({ sessionId }) => {
      socket.join(sessionId);
      console.log(`Survey session created: ${sessionId}`);
      io.to(sessionId).emit("survey-session-created", { sessionId });
    });

    socket.on("join-survey-session", ({ sessionId, userId, username }) => {
      socket.join(sessionId);
      console.log(`User ${username} joined survey: ${sessionId}`);
      io.to(sessionId).emit("user-joined-survey", {
        userId,
        username,
      });
    });

    // Survey Question Management
    socket.on(
      "next-survey-question",
      ({ sessionId, type, item, isLastItem, initialTime }) => {
        console.log(`Sending next question to session: ${sessionId}`);

        const questionData = {
          type,
          question: item,
          isLastQuestion: isLastItem,
          initialTime: initialTime || 30,
        };

        io.to(sessionId).emit("next-survey-question", questionData);
      }
    );

    // Survey Timer
    socket.on("survey-timer-sync", ({ sessionId, timeLeft }) => {
      io.to(sessionId).emit("timer-sync", { timeLeft });
    });

    // Survey Answer Management
    socket.on(
      "survey-submit-answer",
      ({ sessionId, questionId, userId, answer, timeTaken }) => {
        console.log(`Answer received for question ${questionId}`);

        // Emit to admin that an answer was received
        io.to(sessionId).emit("survey-answer-submitted", {
          questionId,
          userId,
          answer,
          timeTaken,
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
      // Add small delay to ensure all answers are processed
      setTimeout(() => {
        io.to(sessionId).emit("survey-completed", {
          message: "Survey has been completed",
        });
      }, 1000);
    });

    // Survey Session End
    socket.on("end-survey-session", ({ sessionId }) => {
      // Add small delay to ensure all operations are complete
      setTimeout(() => {
        io.to(sessionId).emit("survey-session-ended", {
          message: "Survey session has ended",
        });

        // Clear the room
        io.in(sessionId).socketsLeave(sessionId);
      }, 1000);
    });

    // ==================== COMMON HANDLERS ====================

    // Notifications
    socket.on("send-notification", ({ sessionId, notification }) => {
      if (sessionId && notification) {
        io.to(sessionId).emit("receive-notification", notification);
        console.log(
          `Notification sent to session ${sessionId}: ${notification.message}`
        );
      }
    });

    // Disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
