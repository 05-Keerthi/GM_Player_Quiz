const express = require('express');
const leaderboardController = require('../controllers/leaderboardController');
const router = express.Router();

const { auth } = require('../middlewares/auth');

router.get('/leaderboards/:sessionId',auth, leaderboardController.getSessionLeaderboard);
router.get('/leaderboards/:sessionId/:userId', auth, leaderboardController.getUserScoreAndRank);

module.exports = router;
