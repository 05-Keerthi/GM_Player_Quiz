const mongoose = require('mongoose');
const Leaderboard = require('../models/leaderBoard');
const Session = require('../models/session');
const Answer = require('../models/answer');
const User = require('../models/User');

// Fetch leaderboard for a specific session
exports.getSessionLeaderboard = async (req, res) => {
    const { sessionId } = req.params;

    // Validate sessionId
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ message: 'Invalid session ID format' });
    }

    try {
        // Ensure the session exists
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        console.log('Fetching leaderboard for sessionId:', sessionId);
        // Fetch the leaderboard for the session
        const leaderboard = await Leaderboard.find({ session: sessionId })
            .populate({
                path: 'player',
                select: 'username email mobile',
            })
            .sort({ score: -1, rank: 1 }); // Sort by score descending, then rank ascending

        console.log('Leaderboard entries:', leaderboard);

        if (!leaderboard || leaderboard.length === 0) {
            return res.status(404).json({ message: 'No leaderboard data found for this session' });
        }

        // Prepare the response
        const result = leaderboard.map(entry => ({
            user: entry.player,
            totalPoints: entry.score,
            rank: entry.rank,
        }));

        res.status(200).json({
            message: 'Leaderboard fetched successfully',
            leaderboard: result,
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Error fetching leaderboard', error });
    }
};

// Fetch a specific user's score and rank in a session
exports.getUserScoreAndRank = async (req, res) => {
    const { sessionId, userId } = req.params;

    // Validate sessionId and userId
    if (!mongoose.Types.ObjectId.isValid(sessionId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid session or user ID format' });
    }

    try {
        // Ensure the session exists
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Fetch the user's leaderboard entry
        const leaderboardEntry = await Leaderboard.findOne({ session: sessionId, player: userId }).populate({
            path: 'player',
            select: 'username email mobile',
        });

        if (!leaderboardEntry) {
            return res.status(404).json({ message: 'User not found in leaderboard for this session' });
        }

        res.status(200).json({
            message: 'User score and rank fetched successfully',
            user: {
                user: leaderboardEntry.player,
                totalPoints: leaderboardEntry.score,
                rank: leaderboardEntry.rank,
            },
        });
    } catch (error) {
        console.error('Error fetching user score and rank:', error);
        res.status(500).json({ message: 'Error fetching user score and rank', error });
    }
};
