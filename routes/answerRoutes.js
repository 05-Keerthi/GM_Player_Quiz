const express = require('express');
const router = express.Router();
const { 
    submitAnswer, 
    getSessionAnswers, 
    getAnswersForQuestionInSession,
    getAnswerCounts
} = require('../controllers/answerController');

const { auth, isAdmin,} = require('../middlewares/auth');

// Route to submit an answer
router.post('/sessions/:sessionId/questions/:questionId/answer', auth , submitAnswer);

// Admin-only route to get all answers for a session
router.get('/sessions/:sessionId/answers', auth, isAdmin,  getSessionAnswers);

router.get('/sessions/:sessionId/questions/:questionId/answers',auth, isAdmin,  getAnswersForQuestionInSession);

router.get('/getting-count/:sessionId/:questionId',auth, isAdmin, getAnswerCounts);




module.exports = router;






