const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const surveySlideController = require('../controllers/surveySlideController');

// Route to add a new survey slide (admin only)
router.post('/surveys/:surveyQuizId/slides', auth, isAdmin, surveySlideController.addSurveySlide);

router.post("/:surveyquizId/slides/bulk", surveySlideController.addMultipleSurveySlides);

// Route to get all survey slides for a survey
router.get('/surveys/:surveyQuizId/slides', auth, surveySlideController.getSurveySlides);

// Route to get a specific survey slide's details
router.get('/surveys/slides/:id', auth, surveySlideController.getSurveySlide);

// Route to update a survey slide (admin only)
router.put('/surveys/slides/:id', auth, isAdmin, surveySlideController.updateSurveySlide);

// Route to delete a survey slide (admin only)
router.delete('/surveys/slides/:id', auth, isAdmin, surveySlideController.deleteSurveySlide);

module.exports = router;
