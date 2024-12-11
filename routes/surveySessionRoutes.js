const express = require('express');
const router = express.Router();
const { auth,isAdmin } = require('../middlewares/auth');
const {
    createSurveySession

} = require('../controllers/surveySessionController');

// Route to create a survey session
router.post("/survey-sessions/:surveyQuizId/create", auth, isAdmin, createSurveySession);


module.exports = router;
