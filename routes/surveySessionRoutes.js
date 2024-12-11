const express = require('express');
const router = express.Router();
const { auth,isAdmin } = require('../middlewares/auth');
const {
    createSurveySession,
    joinSurveySession

} = require('../controllers/surveySessionController');

// Create a new session
router.post('/sessions/:survey-quizId/publiz', auth, isAdmin, createSurveySession);

router.post('/sessions/:joinCode/join', auth, joinSurveySession);


module.exports = router;
