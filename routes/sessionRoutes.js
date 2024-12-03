const express = require('express');
const router = express.Router();
const { auth,isAdmin } = require('../middlewares/auth');
const {
  createSession,
  joinSession,
  getSessionPlayers,
  startSession,
  getSessionQuestions,
  changeQuestionByCodeAndSession,
  getCurrentQuestionInSession,
  endSession,
} = require('../controllers/sessionController');

// Create a new session
router.post('/sessions/:quizId/publiz', auth, isAdmin, createSession);

// Join a session
router.post('/sessions/:joinCode/join', auth, joinSession);

// Get players who joined a session
router.get('/sessions/:joinCode/:sessionId/players', auth, isAdmin, getSessionPlayers);

// Start the session
router.post('/sessions/:joinCode/:sessionId/start', auth, isAdmin, startSession);

// Fetch questions for a session
router.get('/sessions/:joinCode/:sessionId/questions', auth, getSessionQuestions);

// Route: Change a question in the session by joinCode, sessionId, and questionId
router.post('/sessions/:joinCode/:sessionId/:questionId/change', auth, isAdmin, changeQuestionByCodeAndSession);

// Route: Get the current question in the session by joinCode and sessionId
router.get('/sessions/:joinCode/:sessionId/current-question', auth,  getCurrentQuestionInSession);

// End the session 
router.post('/sessions/:joinCode/:sessionId/end', auth, isAdmin, endSession);

module.exports = router;

