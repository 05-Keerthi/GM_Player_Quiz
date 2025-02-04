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
const { auth, isAdminOrTenantAdmin } = require("../middlewares/auth");

// Get all participated quizzes
router.get("/reports/participated", auth, getParticipatedQuizzesAndSurveys);

// Get attempts for specific quiz
router.get("/reports/quiz/:quizId/attempts", auth, getQuizAttempts);
router.get("/reports/survey/:surveyId/attempts", auth, getSurveyAttempts);

// Get responses for specific session
router.get("/reports/session/:sessionId/responses", auth, getSessionResponses);
router.get("/reports/surveySession/:surveySessionId/responses", auth, getSurveyResponses);


// Admin analytics routes
router.get("/admin/analytics/overall", auth, isAdminOrTenantAdmin, getOverallAnalytics);
router.get("/admin/analytics/quizzes", auth, isAdminOrTenantAdmin, getQuizAnalytics);
router.get("/admin/analytics/quizzes/:quizId", auth, isAdminOrTenantAdmin, getQuizDetailedAnalytics);
router.get("/admin/analytics/quizzes/session/:sessionId", auth, isAdminOrTenantAdmin, getQuizSessionAnalytics);
router.get("/admin/analytics/surveys", auth, isAdminOrTenantAdmin, getSurveyAnalytics);
router.get("/admin/analytics/surveys/:surveyId", auth, isAdminOrTenantAdmin, getSurveyDetailedAnalytics);
router.get("/admin/analytics/surveys/session/:sessionId", auth, isAdminOrTenantAdmin, getSurveySessionAnalytics);

module.exports = router;
