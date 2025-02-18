const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyQuestionController');
const { auth,isAdmin } = require('../middlewares/auth');

// Route to create a new survey question
router.post('/:surveyquizId/create-survey-question', auth, isAdmin, surveyController.createSurveyQuestion);

router.post("/:surveyquizId/questions/bulk", surveyController.addMultipleSurveyQuestions);

// Get all questions for a specific quiz
router.get('/:surveyquizId/survey-question', auth, surveyController.getSurveyQuestions);

// Get a specific survey question by ID
router.get('/:surveyquizId/survey-question/:surveyquestionId', auth, surveyController.getSurveyQuestionById);

// Update a specific survey question by ID
router.put('/:surveyquizId/survey-question/:surveyquestionId', auth, isAdmin, surveyController.updateSurveyQuestionById);

// Delete a specific survey question by ID
router.delete('/:surveyquizId/survey-question/:surveyquestionId', auth, isAdmin, surveyController.deleteSurveyQuestionById);

module.exports = router;
