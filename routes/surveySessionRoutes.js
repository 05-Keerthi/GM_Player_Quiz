const express = require('express');
const router = express.Router();
const { auth,isAdmin } = require('../middlewares/auth');
const {
    createSurveySession,
    joinSurveySession,
    startSurveySession

} = require('../controllers/surveySessionController');

// Route to create a survey session
router.post("/survey-sessions/:surveyQuizId/create", auth, isAdmin, createSurveySession);

router.post('/survey-sessions/:joinCode/join', auth, joinSurveySession);

router.post('/survey-sessions/:joinCode/:sessionId/start', auth, isAdmin, startSurveySession);

module.exports = router;
