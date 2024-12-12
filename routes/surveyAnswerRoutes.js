const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const { submitSurveyAnswer, getAllAnswersForSession, getAnswersForSpecificQuestion } = require('../controllers/surveysubmitanswerController');

// Route for submitting survey answers
router.post('/survey-submit-answer/:sessionId/:questionId', auth, submitSurveyAnswer);

router.get("/survey-answers/:sessionId", auth, isAdmin, getAllAnswersForSession);

// Route to get answers for a specific question in a session
router.get("/survey-answers/:sessionId/:questionId", auth, isAdmin, getAnswersForSpecificQuestion);

module.exports = router;
