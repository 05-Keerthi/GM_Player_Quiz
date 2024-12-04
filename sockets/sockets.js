
const Session = require('../models/session'); 

module.exports = (io) => {
  // Handle socket connection
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a specific room for the session
    socket.on("join-session", async ({ sessionId, joinCode }, callback) => {
      try {
        const session = await Session.findOne({ _id: sessionId, joinCode });
        if (!session) {
          if (callback) {
            return callback({ error: "Session not found" });
          }
          return;
        }

        socket.join(sessionId);
        console.log(`Socket ${socket.id} joined room ${sessionId}`);
        io.to(sessionId).emit("update-session", {
          message: "A new user has joined the session.",
        });

        if (callback) {
          callback({ success: true, session });
        }
      } catch (error) {
        console.error(error);
        if (callback) {
          callback({ error: "Error joining session" });
        }
      }
    });

    // Handle session creation
    socket.on("create-session", ({ sessionId, joinCode }) => {
      socket.join(sessionId);
      console.log(`Session created: ${sessionId}, by Socket: ${socket.id}`);
      io.to(sessionId).emit("session-created", { sessionId, joinCode });
    });

    // Handle start session
    socket.on('start-session', ({ sessionId }, callback) => {
      io.to(sessionId).emit('session-started', { message: 'Session has started' });
      callback({ success: true });
    });

    // Handle broadcast for question changes
    socket.on('change-question', ({ sessionId, question }, callback) => {
      io.to(sessionId).emit('question-changed', { question });
      callback({ success: true });
    });


    // Emit updates when an answer is submitted
      socket.on("answer-submitted", ({ sessionId, answerDetails }) => {
        console.log(`Answer submitted in session ${sessionId}`);
        io.to(sessionId).emit("answer-updated", answerDetails);
      });

    // Handle session ending
    socket.on('end-session', ({ sessionId }, callback) => {
      io.to(sessionId).emit('session-ended', { message: 'Session has ended' });
      callback({ success: true });
    });

    // Emit the next item when requested
    socket.on("next-item", async ({ sessionId, joinCode }, callback) => {
      try {
        const session = await Session.findOne({ _id: sessionId, joinCode }).populate("quiz");
        if (!session) {
          if (callback) {
            return callback({ error: "Session not found" });
          }
          return;
        }

        const quiz = await Quiz.findById(session.quiz)
          .populate("questions")
          .populate("slides");

        if (!quiz) {
          if (callback) {
            return callback({ error: "Quiz not found" });
          }
          return;
        }

        // Combine questions and slides
        const contentItems = [
          ...quiz.questions.map((q) => ({ type: "question", item: q })),
          ...quiz.slides.map((s) => ({ type: "slide", item: s })),
        ];

        if (contentItems.length === 0) {
          if (callback) {
            return callback({ error: "No content available in the quiz" });
          }
          return;
        }

        // Determine the current index
        const currentIndex = session.currentQuestion
          ? contentItems.findIndex(({ item }) => item._id.toString() === session.currentQuestion.toString())
          : -1;

        // Find the next item
        const nextIndex = currentIndex + 1;
        if (nextIndex >= contentItems.length) {
          if (callback) {
            return callback({ error: "No more items left in the session" });
          }
          return;
        }

        const nextItemData = contentItems[nextIndex];
        const nextItem = nextItemData.item;
        const itemType = nextItemData.type;

        // Update the session's current question
        session.currentQuestion = nextItem._id;
        await session.save();

        // Emit the next item to the room
        io.to(sessionId).emit("next-item-updated", {
          message: "Next item retrieved successfully",
          type: itemType,
          item: nextItem,
        });

        if (callback) {
          callback({ success: true, type: itemType, item: nextItem });
        }
      } catch (error) {
        console.error("Error retrieving the next item:", error);
        if (callback) {
          callback({ error: "Error retrieving the next item" });
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
