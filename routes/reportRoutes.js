// const express = require("express");
// const router = express.Router();
// const { auth, isAdmin } = require('../middlewares/auth');
// const reportController = require("../controllers/reportController");

// router.get("/reports", auth, isAdmin, reportController.getAllReports);
// router.get("/reports/user/:userId", auth, reportController.getUserReports);

// router.get("/reports/:quizId/quiz-session", auth,  reportController.getSessionsByQuiz);
// router.get("/reports/:surveyquizId/survey-session", auth,  reportController.getSessionsBySurveyQuiz);

// router.get("/reports/session/:sessionId", auth,  reportController.getSessionReport);
// router.get("/reports/survey-session/:surveysessionId", auth, reportController.getSurveySessionReport);

// router.get("/reports/quiz/:quizId", auth, reportController.getReportByQuiz);
// router.get("/reports/survey-quiz/:surveyquizId", auth, reportController.getReportBySurveyQuiz);
// module.exports = router;


const express = require("express");
const router = express.Router();
const {
  getParticipatedQuizzesAndSurveys,
  getQuizAttempts,
  getSurveyAttempts,
  getSessionResponses,
  getSurveyResponses,
  getAllReports,
} = require("../controllers/reportController");
const { auth, isAdmin } = require("../middlewares/auth");

// Get all participated quizzes
router.get("/reports/participated", auth, getParticipatedQuizzesAndSurveys);

// Get attempts for specific quiz
router.get("/reports/quiz/:quizId/attempts", auth, getQuizAttempts);
router.get("/reports/survey/:surveyId/attempts", auth, getSurveyAttempts);

// Get responses for specific session
router.get("/reports/session/:sessionId/responses", auth, getSessionResponses);
router.get("/reports/surveySession/:surveySessionId/responses", auth, getSurveyResponses);

router.get("/reports", auth, isAdmin, getAllReports);

module.exports = router;