const express = require('express');
const router = express.Router();
const { auth,isAdmin } = require('../middlewares/auth');
const {
  createSession,
  joinSession,
  startSession,
  nextQuestion,
  endSession,
} = require('../controllers/sessionController');

// Create a new session
router.post('/sessions/:quizId/publiz', auth, isAdmin, createSession);

// Join a session
router.post('/sessions/:joinCode/join', auth, joinSession);

// Start the session
router.post('/sessions/:joinCode/:sessionId/start', auth, isAdmin, startSession);

// next move to the session
router.post('/sessions/:joinCode/:sessionId/next', auth, isAdmin, nextQuestion);

// End the session 
router.post('/sessions/:joinCode/:sessionId/end', auth, isAdmin, endSession);

module.exports = router;

