const express = require("express");
const router = express.Router();
const {
  auth,
  optionalAuth,
  isAdmin,
  isAdminOrTenantAdmin,
} = require("../middlewares/auth");
const {
  createSurveySession,
  joinSurveySession,
  startSurveySession,
  nextSurveyQuestion,
  endSurveySession,
} = require("../controllers/surveySessionController");

// Admin routes - require full authentication
router.post("/survey-sessions/:surveyQuizId/create", auth, isAdminOrTenantAdmin, createSurveySession );

// Routes that support both authenticated and guest users
router.post("/survey-sessions/:joinCode/join", optionalAuth, joinSurveySession );

// Admin routes for session management
router.post("/survey-sessions/:joinCode/:sessionId/start", auth, isAdminOrTenantAdmin, startSurveySession );

router.post("/survey-sessions/:joinCode/:sessionId/next", auth, isAdminOrTenantAdmin, nextSurveyQuestion );

router.post( "/survey-sessions/:joinCode/:sessionId/end", auth, isAdminOrTenantAdmin, endSurveySession );

module.exports = router;
