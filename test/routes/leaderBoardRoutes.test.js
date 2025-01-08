const request = require('supertest');
const express = require('express');
const router = require('../../routes/leaderboardRoutes');
const leaderboardController = require('../../controllers/leaderboardController');

// Mock the middlewares
jest.mock('../../middlewares/auth', () => ({
    auth: jest.fn((req, res, next) => next()),
    isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock the leaderboardController functions
jest.mock('../../controllers/leaderboardController', () => ({
    getSessionLeaderboard: jest.fn((req, res) => res.status(200).json({ message: 'Leaderboard retrieved successfully' })),
    getUserScoreAndRank: jest.fn((req, res) => res.status(200).json({ message: 'User score and rank retrieved successfully' })),
}));

// Import the mocks after defining them
const { auth } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Leaderboard Routes', () => {
    // Test GET /api/leaderboards/:sessionId
    it('should call getSessionLeaderboard when a valid GET request is made to /api/leaderboards/:sessionId', async () => {
        const res = await request(app).get('/api/leaderboards/1');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(leaderboardController.getSessionLeaderboard).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Leaderboard retrieved successfully');
    });

    // Test GET /api/leaderboards/:sessionId/:userId
    it('should call getUserScoreAndRank when a valid GET request is made to /api/leaderboards/:sessionId/:userId', async () => {
        const res = await request(app).get('/api/leaderboards/1/123');

        expect(auth).toHaveBeenCalledTimes(2); // Adjusted expectation
        expect(leaderboardController.getUserScoreAndRank).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('User score and rank retrieved successfully');
    });
});
