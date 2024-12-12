const express = require('express');
const router = express.Router();
const surveyNotificationController = require('../controllers/surveyNotificationController');
const { auth, isAdmin } = require('../middlewares/auth'); // Add your auth middlewares


// Create a notification (admin only)
router.post('/survey-notifications', auth, isAdmin, surveyNotificationController.createSurveyNotification);

router.get('/survey-notifications/:userId', auth, surveyNotificationController.getSurveyNotificationsByUserId);

router.put('/survey-notifications/:id', auth, surveyNotificationController.markSurveyNotificationAsRead);

router.delete('/survey-notifications/:id', auth, isAdmin, surveyNotificationController.deleteSurveyNotification);

module.exports = router;
