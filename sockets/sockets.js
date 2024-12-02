
const Session = require('../models/session'); 

module.exports = (io) => {
  // Handle socket connection
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a specific room for the session
    socket.on('join-session', async ({ sessionId, joinCode }, callback) => {
      try {
        const session = await Session.findOne({ _id: sessionId, joinCode });
        if (!session) {
          return callback({ error: 'Session not found' });
        }

        socket.join(sessionId); // Join the room specific to the session
        console.log(`Socket ${socket.id} joined room ${sessionId}`);
        io.to(sessionId).emit('update-session', { message: 'A new user has joined the session.' });

        callback({ success: true, session });
      } catch (error) {
        console.error(error);
        callback({ error: 'Error joining session' });
      }
    });

    // Handle session creation
    socket.on('create-session', ({ sessionId, joinCode }, callback) => {
      socket.join(sessionId); // Automatically join the session room
      console.log(`Session created: ${sessionId}, by Socket: ${socket.id}`);

      // Emit a message to everyone in the room
      io.to(sessionId).emit('session-created', { sessionId, joinCode });

      callback({ success: true });
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

    // // Handle player updates
    // socket.on('player-update', ({ sessionId, player }, callback) => {
    //   io.to(sessionId).emit('player-updated', { player });
    //   callback({ success: true });
    // });

    // Handle session ending
    socket.on('end-session', ({ sessionId }, callback) => {
      io.to(sessionId).emit('session-ended', { message: 'Session has ended' });
      callback({ success: true });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
