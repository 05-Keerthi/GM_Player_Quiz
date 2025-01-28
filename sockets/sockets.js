// const Answer = require("../models/answer");
// const Question = require("../models/question");

// module.exports = (io) => {
//   io.on("connection", (socket) => {
    
//     // ==================== QUIZ SOCKET HANDLERS ====================

//     // Quiz Session Management
//     socket.on("join-session", async ({ sessionId, userId, username }) => {
//       try {
//         socket.join(sessionId);
//         io.to(sessionId).emit("user-joined", {
//           message: "A new user has joined the session.",
//           userId,
//           username,
//         });
//       } catch (error) {
//         console.error("Error joining session:", error);
//       }
//     });

//     socket.on("create-session", ({ sessionId }) => {
//       socket.join(sessionId);
//       io.to(sessionId).emit("session-created", { sessionId });
//     });

//     // Quiz Question Management
//     socket.on("next-item", ({ sessionId, type, item, isLastItem, progress }) => {
//       io.to(sessionId).emit("next-item", {
//         type,
//         item,
//         isLastItem,
//         progress,
//       });
//     });

//     // Quiz Timer
//     socket.on("timer-sync", ({ sessionId, timeLeft }) => {
//       io.to(sessionId).emit("timer-sync", { timeLeft });
//     });

//     // Quiz Answer Management
//     socket.on("answer-submitted", async ({ sessionId, answerDetails }) => {
//       try {
//         io.to(sessionId).emit("answer-submitted", { answerDetails });

//         if (answerDetails.questionId) {
//           const answers = await Answer.find({
//             session: sessionId,
//             question: answerDetails.questionId,
//           });

//           const question = await Question.findById(answerDetails.questionId);
//           if (question && question.options) {
//             const optionCounts = {};
//             question.options.forEach((option, index) => {
//               const letter = String.fromCharCode(65 + index);
//               optionCounts[letter] = answers.filter(
//                 (a) => a.answer === option.text
//               ).length;
//             });

//             io.to(sessionId).emit("answer-counts-updated", {
//               questionId: answerDetails.questionId,
//               counts: optionCounts,
//             });
//           }
//         }
//       } catch (error) {
//         console.error("Error handling answer submission:", error);
//       }
//     });

//     // Quiz Completion
//     socket.on("quiz-completed", ({ sessionId }) => {
//       io.to(sessionId).emit("quiz-completed", {
//         message: "Quiz has been completed",
//       });
//     });

//     // Quiz Session End
//     socket.on("end-session", ({ sessionId }) => {
//       try {
//         io.to(sessionId).emit("session-ended", {
//           message: "Session has ended",
//         });
//         io.to(sessionId).emit("quiz-completed", {
//           message: "Quiz has been completed",
//         });
//         io.in(sessionId).socketsLeave(sessionId);
//       } catch (error) {
//         console.error("Error ending session:", error);
//       }
//     });

//     // ==================== SURVEY SOCKET HANDLERS ====================

//     // Survey Session Management
//     socket.on("create-survey-session", ({ sessionId }) => {
//       socket.join(sessionId);
//       io.to(sessionId).emit("survey-session-created", { sessionId });
//     });

//     socket.on(
//       "join-survey-session",
//       ({ sessionId, userId, username, isGuest }) => {
//         socket.join(sessionId);
//         io.to(sessionId).emit("user-joined-survey", {
//           userId,
//           username,
//           isGuest,
//         });
//       }
//     );

//     // Survey Content Management
//     socket.on(
//       "next-survey-question",
//       ({ sessionId, type, item, isLastItem, initialTime, progress }) => {
//         io.to(sessionId).emit("next-survey-question", {
//           type,
//           question: item,
//           isLastQuestion: isLastItem,
//           initialTime: initialTime || 30,
//           progress,
//         });
//       }
//     );

//     // Timer Management
//     socket.on("survey-timer-sync", ({ sessionId, timeLeft }) => {
//       io.to(sessionId).emit("timer-sync", { timeLeft });
//     });

//     // Answer Management
//     socket.on(
//       "survey-submit-answer",
//       ({ sessionId, questionId, userId, answer, timeTaken, isGuest }) => {
//         // Emit to admin for tracking
//         io.to(sessionId).emit("survey-answer-submitted", {
//           questionId,
//           userId,
//           answer,
//           timeTaken,
//           isGuest,
//         });

//         // Confirm back to user
//         socket.emit("answer-submission-confirmed", {
//           status: "success",
//           questionId,
//         });
//       }
//     );

//     // Survey Completion
//     socket.on("survey-completed", ({ sessionId }) => {
//       setTimeout(() => {
//         io.to(sessionId).emit("survey-completed", {
//           message: "Survey has been completed",
//         });
//       }, 1000);
//     });

//     // Survey Session End
//     socket.on("end-survey-session", ({ sessionId }) => {
//       try {
//         io.to(sessionId).emit("survey-session-ended", {
//           message: "Survey session has ended",
//         });
//         io.in(sessionId).socketsLeave(sessionId);
//       } catch (error) {
//         console.error("Error ending survey session:", error);
//       }
//     });
//     // ==================== COMMON HANDLERS ====================

//     // Notifications
//     socket.on("send-notification", ({ sessionId, notification }) => {
//       if (sessionId && notification) {
//         io.to(sessionId).emit("receive-notification", notification);
//       }
//     });

//     // Disconnection
//     socket.on("disconnect", () => {
//       console.log("User disconnected");
//     });
//   });
// };





const Answer = require("../models/answer");
const Question = require("../models/question");
const Session = require("../models/session"); 
const mongoose = require('mongoose');
const surveySession = require("../models/surveysession")

module.exports = (io) => {
  const userSockets = new Map();

  io.on("connection", (socket) => {
    
    // ==================== QUIZ SOCKET HANDLERS ====================

    // Quiz Session Management
    socket.on("join-session", async ({ sessionId, userId, username }) => {
      try {
        console.log("Join session request received:", { sessionId, userId, username });

        // Validate required fields
        if (!sessionId) {
          throw new Error("sessionId is required");
        }
        if (!userId) {
          throw new Error("userId is required");
        }
        if (!username) {
          throw new Error("username is required");
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
          throw new Error("Invalid sessionId format");
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          throw new Error("Invalid userId format");
        }

        // Join the socket room
        socket.join(sessionId);
        
        // Store user data
        const userData = {
          userId: userId.toString(), // Ensure consistent string format
          sessionId: sessionId.toString(),
          username
        };
        
        socket.userData = userData;
        userSockets.set(socket.id, userData);
        
        console.log("Stored socket mapping:", {
          socketId: socket.id,
          userData
        });

        // Update session players in database
        const updatedSession = await Session.findByIdAndUpdate(
          sessionId,
          { $addToSet: { players: userId } },
          { new: true }
        );
        
        if (!updatedSession) {
          throw new Error("Session not found");
        }

        console.log("Session updated after join:", {
          sessionId,
          players: updatedSession.players.map(p => p.toString())
        });

        io.to(sessionId).emit("user-joined", {
          message: "A new user has joined the session.",
          userId,
          username,
        });

      } catch (error) {
        console.error("Error in join-session:", error.message);
        socket.emit("error", { 
          message: "Failed to join session: " + error.message,
          details: {
            sessionId,
            userId,
            username
          }
        });
      }
    });

    socket.on("create-session", ({ sessionId }) => {
      socket.join(sessionId);
      io.to(sessionId).emit("session-created", { sessionId });
    });

    // Quiz Question Management
    socket.on("next-item", ({ sessionId, type, item, isLastItem, progress }) => {
      io.to(sessionId).emit("next-item", {
        type,
        item,
        isLastItem,
        progress,
      });
    });

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

    // Survey Session Management
    socket.on("create-survey-session", ({ sessionId }) => {
      socket.join(sessionId);
      io.to(sessionId).emit("survey-session-created", { sessionId });
    });

    socket.on("join-survey-session", async ({ sessionId, userId, username, isGuest }) => {
      try {
        console.log("Join survey session request received:", { sessionId, userId, username, isGuest });
    
        // Validate required fields
        if (!sessionId) {
          throw new Error("sessionId is required");
        }
        if (!userId) {
          throw new Error("userId is required");
        }
        if (!username) {
          throw new Error("username is required");
        }
    
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
          throw new Error("Invalid sessionId format");
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          throw new Error("Invalid userId format");
        }
    
        // Join the socket room
        socket.join(sessionId);
        
        // Store user data
        const userData = {
          userId: userId.toString(),
          sessionId: sessionId.toString(),
          username,
          isGuest
        };
        
        socket.userData = userData;
        userSockets.set(socket.id, userData);
        
        console.log("Stored socket mapping for survey:", {
          socketId: socket.id,
          userData
        });
    
        // Update session players in database
        const updatedSession = await surveySession.findByIdAndUpdate(
          sessionId,
          { $addToSet: { surveyPlayers: userId } },
          { new: true }
        );
        
        if (!updatedSession) {
          throw new Error("Survey session not found");
        }
    
        console.log("Survey session updated after join:", {
          sessionId,
          players: updatedSession.surveyPlayers.map(p => p.toString())
        });
    
        io.to(sessionId).emit("user-joined-survey", {
          message: "A new user has joined the survey session.",
          userId,
          username,
          isGuest
        });
    
      } catch (error) {
        console.error("Error in join-survey-session:", error.message);
        socket.emit("error", { 
          message: "Failed to join survey session: " + error.message,
          details: {
            sessionId,
            userId,
            username,
            isGuest
          }
        });
      }
    });

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
        console.log("Disconnect event triggered for socket:", socket.id);
        
        const userData = userSockets.get(socket.id) || socket.userData;
        console.log("User data from socket:", userData);
        
        if (!userData || !userData.userId || !userData.sessionId) {
          console.log("Invalid user data for socket:", socket.id);
          return;
        }
    
        const { userId, sessionId } = userData;
        console.log("Processing disconnect for user:", { userId, sessionId });
    
        // Validate ObjectIds before database operation
        if (!mongoose.Types.ObjectId.isValid(sessionId) || !mongoose.Types.ObjectId.isValid(userId)) {
          throw new Error("Invalid ID format in stored user data");
        }
    
        // Try to update quiz session first
        const updatedQuizSession = await Session.findOneAndUpdate(
          { _id: sessionId },
          { $pull: { players: userId } },
          { new: true }
        );
    
        // If no quiz session found, try to update survey session
        if (!updatedQuizSession) {
          const updatedSurveySession = await surveySession.findOneAndUpdate(
            { _id: sessionId },
            { $pull: { surveyPlayers: userId } },
            { new: true }
          );
          
          console.log("Survey session updated after disconnect:", {
            sessionId,
            previousPlayers: updatedSurveySession ? updatedSurveySession.surveyPlayers.map(p => p.toString()) : []
          });
        } else {
          console.log("Quiz session updated after disconnect:", {
            sessionId,
            previousPlayers: updatedQuizSession.players.map(p => p.toString())
          });
        }
    
        // Clean up socket mappings
        userSockets.delete(socket.id);
        console.log("Removed socket mapping for:", socket.id);
    
        // Notify other users
        io.to(sessionId).emit("user-disconnected", {
          message: "A user has disconnected from the session.",
          userId,
          timestamp: new Date()
        });
    
      } catch (error) {
        console.error("Error in disconnect handler:", error);
      }
    });
  });
};
