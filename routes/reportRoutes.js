const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const reportController = require("../controllers/reportController");

router.get("/reports", auth, isAdmin, reportController.getAllReports);
router.get("/reports/user/:userId", auth, reportController.getUserReports);

router.get("/reports/:quizId/quiz-session", auth, isAdmin, reportController.getSessionsByQuiz);
router.get("/reports/:surveyquizId/survey-session", auth, isAdmin, reportController.getSessionsBySurveyQuiz);

router.get("/reports/session/:sessionId", auth, isAdmin, reportController.getSessionReport);
router.get("/reports/survey-session/:surveysessionId", auth, isAdmin, reportController.getSurveySessionReport);

router.get("/reports/quiz/:quizId", auth, isAdmin, reportController.getReportByQuiz);
router.get("/reports/survey-quiz/:surveyquizId", auth, isAdmin, reportController.getReportBySurveyQuiz);

module.exports = router;

