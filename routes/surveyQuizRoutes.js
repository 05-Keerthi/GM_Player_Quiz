const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const {
    createSurveyQuiz,
    getAllSurveyQuizzes,
    getSurveyQuizById,
    updateSurveyQuiz,
    deleteSurveyQuiz,
    publishSurveyQuiz,
    closeSurveyQuiz
} = require('../controllers/surveyQuizController');

// Create a new quiz (admin only)
router.post('/survey-quiz', auth, isAdmin, createSurveyQuiz);

router.get('/survey-quiz', getAllSurveyQuizzes );

router.get('/survey-quiz/:id', auth, isAdmin, getSurveyQuizById);

router.put('/survey-quiz/:id', auth, isAdmin, updateSurveyQuiz);

router.delete('/survey-quiz/:id', auth, isAdmin, deleteSurveyQuiz);

router.post('/survey-quiz/:id/publish', auth, isAdmin, publishSurveyQuiz);

router.post('/survey-quiz/:id/close', auth, isAdmin, closeSurveyQuiz);

module.exports = router;
