const express = require('express');
const router = express.Router();
const { 
    submitAnswer, 
    getSessionAnswers, 
    getAnswersForQuestionInSession, 
    getLeaderboard, 
    getUserRankAndScore 
} = require('../controllers/answerController');

const { auth } = require('../middlewares/auth');

// Route to submit an answer
router.post('/sessions/:sessionId/questions/:questionId/answer', auth , submitAnswer);

// Admin-only route to get all answers for a session
router.get('/sessions/:sessionId/answers', auth,  getSessionAnswers);

router.get('/sessions/:sessionId/questions/:questionId/answers',auth,  getAnswersForQuestionInSession);




module.exports = router;






