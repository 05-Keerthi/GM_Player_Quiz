const express = require('express');
const leaderboardController = require('../controllers/leaderboardController');
const router = express.Router();

const { auth, isAdmin, } = require('../middlewares/auth');

router.get('/leaderboards/:sessionId',auth, isAdmin, leaderboardController.getSessionLeaderboard);
router.get('/leaderboards/:sessionId/:userId', auth, leaderboardController.getUserScoreAndRank);

module.exports = router;
