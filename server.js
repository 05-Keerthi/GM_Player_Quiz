
const app = require('./app');
const http = require('http');
const connectDB = require('./config/db');
// const socketIo = require('socket.io');
// const socketHandler = require('./sockets/sockets');

const PORT = process.env.PORT || 5000;

// Connect to the database
connectDB();

// Create an HTTP server using the Express app
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server
// const io = socketIo(server, {
//   cors: {
//     origin: "*", // Allow all origins (adjust this for production to restrict origins)
//     methods: ["GET", "POST"]
// }});

// // Pass the Socket.IO instance to the app so it can be used in controllers
// app.set('socketio', io);

// // Handle socket events
// socketHandler(io);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
