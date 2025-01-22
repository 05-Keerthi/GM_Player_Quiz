const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const reportController = require("../controllers/reportController");

router.get("/reports", auth, isAdmin, reportController.getAllReports);
router.get("/reports/user/:userId", auth, reportController.getUserReports);
router.get("/reports/:quizId", auth, isAdmin, reportController.getReportByQuiz);
router.get("/reports/:quizId/user/:userId", auth, reportController.getUserReportByQuiz);
router.get("/reports/:quizId/stats", auth, reportController.getQuizStats);

module.exports = router;
