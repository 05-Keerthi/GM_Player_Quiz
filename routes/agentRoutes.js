const express = require("express");
const {
  getTopics,
  generateQuestions,
  generateSurveyQuestions,
  generateArtPulseSurvey
} = require("../controllers/agentController");
const router = express.Router();

router.post("/topics", getTopics);
router.post("/questions", generateQuestions);
router.post("/survey-questions", generateSurveyQuestions);
router.post("/Artpulse-questions", generateArtPulseSurvey);

module.exports = router;