const express = require("express");
const router = express.Router();
const {
  getParticipatedQuizzesAndSurveys,
  getQuizAttempts,
  getSurveyAttempts,
  getSessionResponses,
  getSurveyResponses,
  // Admin analytics
  getOverallAnalytics,
  getQuizAnalytics,
  getQuizDetailedAnalytics,
  getQuizSessionAnalytics,
  getSurveyAnalytics,
  getSurveyDetailedAnalytics,
  getSurveySessionAnalytics,
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


// Admin analytics routes
router.get("/admin/analytics/overall", auth, isAdmin, getOverallAnalytics);
router.get("/admin/analytics/quizzes", auth, isAdmin, getQuizAnalytics);
router.get("/admin/analytics/quizzes/:quizId", auth, isAdmin, getQuizDetailedAnalytics);
router.get("/admin/analytics/quizzes/session/:sessionId", auth, isAdmin, getQuizSessionAnalytics);
router.get("/admin/analytics/surveys", auth, isAdmin, getSurveyAnalytics);
router.get("/admin/analytics/surveys/:surveyId", auth, isAdmin, getSurveyDetailedAnalytics);
router.get("/admin/analytics/surveys/session/:sessionId", auth, isAdmin, getSurveySessionAnalytics);

module.exports = router;
