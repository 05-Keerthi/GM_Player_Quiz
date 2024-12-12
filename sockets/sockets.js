// const Session = require('../models/session'); 

// module.exports = (io) => {
//   // Handle socket connection
//   io.on('connection', (socket) => {
//     console.log(`User connected: ${socket.id}`);

//     // Join a specific room for the session
//     socket.on("join-session", async ({ sessionId, joinCode }, callback) => {
//       try {
//         const session = await Session.findOne({ _id: sessionId, joinCode });
//         if (!session) {
//           if (callback) {
//             return callback({ error: "Session not found" });
//           }
//           return;
//         }

//         socket.join(sessionId);
//         console.log(`Socket ${socket.id} joined room ${sessionId}`);
//         io.to(sessionId).emit("update-session", {
//           message: "A new user has joined the session.",
//         });

//         if (callback) {
//           callback({ success: true, session });
//         }
//       } catch (error) {
//         console.error(error);
//         if (callback) {
//           callback({ error: "Error joining session" });
//         }
//       }
//     });

//     // Handle session creation
//     socket.on("create-session", ({ sessionId, joinCode }) => {
//       socket.join(sessionId);
//       console.log(`Session created: ${sessionId}, by Socket: ${socket.id}`);
//       io.to(sessionId).emit("session-created", { sessionId, joinCode });
//     });

//     // Handle start session
//     socket.on('start-session', ({ sessionId }, callback) => {
//       io.to(sessionId).emit('session-started', { message: 'Session has started' });
//       callback({ success: true });
//     });

//     // Handle broadcast for question changes
//     socket.on('change-question', ({ sessionId, question }, callback) => {
//       io.to(sessionId).emit('question-changed', { question });
//       callback({ success: true });
//     });


//     // Emit updates when an answer is submitted
//       socket.on("answer-submitted", ({ sessionId, answerDetails }) => {
//         console.log(`Answer submitted in session ${sessionId}`);
//         io.to(sessionId).emit("answer-updated", answerDetails);
//       });

//     // Handle session ending
//     socket.on('end-session', ({ sessionId }, callback) => {
//       io.to(sessionId).emit('session-ended', { message: 'Session has ended' });
//       callback({ success: true });
//     });

//     // Emit the next item when requested
//     socket.on("next-item", async ({ sessionId, joinCode }, callback) => {
//       try {
//         const session = await Session.findOne({ _id: sessionId, joinCode }).populate("quiz");
//         if (!session) {
//           if (callback) {
//             return callback({ error: "Session not found" });
//           }
//           return;
//         }

//         const quiz = await Quiz.findById(session.quiz)
//           .populate("questions")
//           .populate("slides");

//         if (!quiz) {
//           if (callback) {
//             return callback({ error: "Quiz not found" });
//           }
//           return;
//         }

//         // Combine questions and slides
//         const contentItems = [
//           ...quiz.questions.map((q) => ({ type: "question", item: q })),
//           ...quiz.slides.map((s) => ({ type: "slide", item: s })),
//         ];

//         if (contentItems.length === 0) {
//           if (callback) {
//             return callback({ error: "No content available in the quiz" });
//           }
//           return;
//         }

//         // Determine the current index
//         const currentIndex = session.currentQuestion
//           ? contentItems.findIndex(({ item }) => item._id.toString() === session.currentQuestion.toString())
//           : -1;

//         // Find the next item
//         const nextIndex = currentIndex + 1;
//         if (nextIndex >= contentItems.length) {
//           if (callback) {
//             return callback({ error: "No more items left in the session" });
//           }
//           return;
//         }

//         const nextItemData = contentItems[nextIndex];
//         const nextItem = nextItemData.item;
//         const itemType = nextItemData.type;

//         // Update the session's current question
//         session.currentQuestion = nextItem._id;
//         await session.save();

//         // Emit the next item to the room
//         io.to(sessionId).emit("next-item-updated", {
//           message: "Next item retrieved successfully",
//           type: itemType,
//           item: nextItem,
//         });

//         if (callback) {
//           callback({ success: true, type: itemType, item: nextItem });
//         }
//       } catch (error) {
//         console.error("Error retrieving the next item:", error);
//         if (callback) {
//           callback({ error: "Error retrieving the next item" });
//         }
//       }
//     });

//     socket.on('emit-answer-counts', async ({ sessionId, questionId }, callback) => {
//       try {
//         const session = await Session.findById(sessionId);
//         if (!session) {
//           return callback({ error: 'Session not found' });
//         }

//         const question = await Question.findById(questionId);
//         if (!question) {
//           return callback({ error: 'Question not found' });
//         }

//         const answers = await Answer.find({ session: sessionId, question: questionId });
//         const correctCount = answers.filter(answer => answer.isCorrect).length;
//         const incorrectCount = answers.length - correctCount;

//         io.to(sessionId).emit('answer-counts', {
//           message: 'Answer counts updated',
//           question: question.questionText,
//           correctCount,
//           incorrectCount,
//         });

//         callback({ success: true, correctCount, incorrectCount });
//       } catch (error) {
//         console.error('Error emitting answer counts:', error);
//         callback({ error: 'Error emitting answer counts' });
//       }
//     });

//     // Handle disconnection
//     socket.on('disconnect', () => {
//       console.log(`User disconnected: ${socket.id}`);
//     });
//   });
// };



const Session = require("../models/session");
const Answer = require("../models/answer");
const Question = require("../models/question");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a specific room for the session
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

    // Handle session creation
    socket.on("create-session", ({ sessionId }) => {
      socket.join(sessionId);
      console.log(`Session created: ${sessionId}, by Socket: ${socket.id}`);
      io.to(sessionId).emit("session-created", { sessionId });
    });

    // Handle next item
    socket.on("next-item", ({ sessionId, type, item, isLastItem }) => {
      io.to(sessionId).emit("next-item", {
        type,
        item,
        isLastItem,
      });
    });

    // Handle timer synchronization
    socket.on("timer-sync", ({ sessionId, timeLeft }) => {
      io.to(sessionId).emit("timer-sync", { timeLeft });
    });

    // Enhanced answer submission handling with count updates
    socket.on("answer-submitted", async ({ sessionId, answerDetails }) => {
      try {
        console.log("Answer submitted:", { sessionId, answerDetails });

        // Emit the answer submission event
        io.to(sessionId).emit("answer-submitted", { answerDetails });

        // Fetch and emit updated answer counts
        if (answerDetails.questionId) {
          const answers = await Answer.find({
            session: sessionId,
            question: answerDetails.questionId,
          });

          const question = await Question.findById(answerDetails.questionId);
          if (question && question.options) {
            // Count answers for each option
            const optionCounts = {};
            question.options.forEach((option, index) => {
              const letter = String.fromCharCode(65 + index); // A, B, C, D
              optionCounts[letter] = answers.filter(
                (a) => a.answer === option.text
              ).length;
            });

            // Emit updated counts
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

      // Admin triggers notification
      socket.on("send-notification", async ({ sessionId, notification }) => {
        if (!sessionId || !notification) {
          return socket.emit("error", "Session ID and notification data are required.");
        }
        try {
          io.to(sessionId).emit("receive-notification", notification); 
          console.log(`Notification sent to session ${sessionId}: ${notification.message}`);
        } catch (error) {
          console.error("Error sending notification:", error);
          socket.emit("error", "An error occurred while sending the notification.");
        }
      });
  
      // Mark notification as read (real-time feedback)
      socket.on("mark-notification-read", async ({ notificationId, userId }) => {
        try {
          const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, user: userId },
            { read: true },
            { new: true }
          );
  
          if (!notification) {
            return socket.emit("error", "Notification not found or unauthorized.");
          }
          socket.emit("notification-updated", notification);
          console.log(`Notification ${notificationId} marked as read by user ${userId}`);
        } catch (error) {
          console.error("Error marking notification as read:", error);
          socket.emit("error", "An error occurred while marking the notification as read.");
        }
      });

    // Handle quiz completion
    socket.on("quiz-completed", ({ sessionId }) => {
    io.to(sessionId).emit("quiz-completed", {
        message: "Quiz has been completed",
        });
    });

        // Handle leaderboard updates
        socket.on("join-leaderboard", ({ sessionId }) => {
          socket.join(`${sessionId}-leaderboard`);
        });
    

    // Handle session ending
    socket.on("end-session", ({ sessionId }) => {
      try {
        io.to(sessionId).emit("session-ended", {
          message: "Session has ended",
        });

        // Also emit quiz-completed to ensure all clients update their state
        io.to(sessionId).emit("quiz-completed", {
          message: "Quiz has been completed",
        });

        // Clear the room
        io.in(sessionId).socketsLeave(sessionId);
      } catch (error) {
        console.error("Error ending session:", error);
      }
    });

    // Handle survey session creation
    socket.on("create-survey-session", ({ sessionId }) => {
      socket.join(sessionId);
      console.log(`Survey session created: ${sessionId}, by Socket: ${socket.id}`);
      io.to(sessionId).emit("survey-session-created", { sessionId });
    });

    // Join a specific room for a survey session
    socket.on("join-survey-session", async ({ sessionId, userId, username }) => {
      try {
        socket.join(sessionId);
        console.log(`Socket ${socket.id} joined survey room ${sessionId}`);
        io.to(sessionId).emit("user-joined-survey", {
          message: "A new user has joined the survey session.",
          userId,
          username,
        });
      } catch (error) {
        console.error("Error joining survey session:", error);
      }
    });

    // Handle next survey question
    socket.on("next-survey-question", ({ sessionId, question, isLastQuestion }) => {
      io.to(sessionId).emit("next-survey-question", {
        question,
        isLastQuestion,
      });
    });

     // Handle survey session completion
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
    
    // Listen for the 'survey-submit-answer' event
    socket.on("survey-submit-answer", ({ sessionId, questionId, userId, answer, timeTaken }) => {
      try {
        // Emit the answer submission to all clients in the session
        io.to(sessionId).emit("survey-answer-submitted", {
          message: `User ${userId} answered question ${questionId}`,
          answer,
          timeTaken,
          userId,
          questionId,
        });
    
        // Optionally, you can track the submission or update the status of the session if needed
        console.log(`Answer submitted for session ${sessionId} by user ${userId}: ${answer}`);
      } catch (error) {
        console.error("Error submitting survey answer:", error);
      }
    });
    
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
