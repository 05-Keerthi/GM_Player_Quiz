const express = require("express");
const {
  getTopics,
  generateQuestions,
} = require("../controllers/agentController");
const router = express.Router();

router.post("/topics", getTopics);
router.post("/questions", generateQuestions);

module.exports = router;