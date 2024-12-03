const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, default: 0 },
    rank: { type: Number }, // Optional: Rank can be updated based on scores
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
