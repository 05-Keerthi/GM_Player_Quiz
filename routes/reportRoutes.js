const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const reportController = require('../controllers/reportController');

// GET /api/reports - Get all reports (Admin Analytics View)
router.get('/reports', auth, isAdmin, reportController.getAllReports);

// GET /api/reports/:quizId - Get reports for a specific quiz
router.get('/reports/:quizId', auth, reportController.getReportByQuiz);

router.get('/reports/:quizId/user/:userId', auth, reportController.getUserReportByQuiz);

module.exports = router;
