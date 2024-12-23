// In your backend routes file
const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.get("/reports", reportController.getAllReports);
router.get("/reports/user/:userId", reportController.getUserReports);
router.get("/reports/:quizId", reportController.getReportByQuiz);
router.get(
  "/reports/:quizId/user/:userId",
  reportController.getUserReportByQuiz
);
router.get("/reports/:quizId/stats", reportController.getQuizStats);

module.exports = router;
