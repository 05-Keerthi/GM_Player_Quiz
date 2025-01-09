const mongoose = require('mongoose');
const Leaderboard = require('../../models/leaderBoard');
const Session = require('../../models/session');
const User = require('../../models/User');

// Mock the dependencies
jest.mock('../../models/leaderBoard');
jest.mock('../../models/session');
jest.mock('../../models/User');

const {
  getSessionLeaderboard,
  getUserScoreAndRank
} = require('../../controllers/leaderboardController');

describe('Leaderboard Controller', () => {
  let req;
  let res;
  const mockConsoleLog = jest.spyOn(console, 'log');
  const mockConsoleError = jest.spyOn(console, 'error');

  beforeEach(() => {
    req = {
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('getSessionLeaderboard', () => {
    const validSessionId = '507f1f77bcf86cd799439011';

    it('should get session leaderboard successfully', async () => {
      // Setup
      req.params = { sessionId: validSessionId };

      const mockSession = {
        _id: validSessionId,
        title: 'Test Session'
      };

      const mockLeaderboard = [
        {
          player: {
            _id: 'user1',
            username: 'player1',
            email: 'player1@test.com',
            mobile: '1234567890'
          },
          score: 100,
          rank: 1
        },
        {
          player: {
            _id: 'user2',
            username: 'player2',
            email: 'player2@test.com',
            mobile: '0987654321'
          },
          score: 90,
          rank: 2
        }
      ];

      Session.findById.mockResolvedValue(mockSession);
      Leaderboard.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockLeaderboard)
      });

      // Execute
      await getSessionLeaderboard(req, res);

      // Assert
      expect(Session.findById).toHaveBeenCalledWith(validSessionId);
      expect(Leaderboard.find).toHaveBeenCalledWith({ session: validSessionId });
      expect(mockConsoleLog).toHaveBeenCalledWith('Fetching leaderboard for sessionId:', validSessionId);
      expect(mockConsoleLog).toHaveBeenCalledWith('Leaderboard entries:', mockLeaderboard);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Leaderboard fetched successfully',
        leaderboard: expect.arrayContaining([
          expect.objectContaining({
            user: expect.objectContaining({
              username: 'player1'
            }),
            totalPoints: 100,
            rank: 1
          })
        ])
      });
    });

    it('should return 400 for invalid session ID format', async () => {
      // Setup
      req.params = { sessionId: 'invalid-id' };

      // Execute
      await getSessionLeaderboard(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid session ID format'
      });
    });

    it('should return 404 when session not found', async () => {
      // Setup
      req.params = { sessionId: validSessionId };
      Session.findById.mockResolvedValue(null);

      // Execute
      await getSessionLeaderboard(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Session not found'
      });
    });

    it('should return 404 when no leaderboard data found', async () => {
      // Setup
      req.params = { sessionId: validSessionId };
      Session.findById.mockResolvedValue({ _id: validSessionId });
      Leaderboard.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      // Execute
      await getSessionLeaderboard(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No leaderboard data found for this session'
      });
    });

    it('should handle errors when fetching leaderboard', async () => {
      // Setup
      req.params = { sessionId: validSessionId };
      const error = new Error('Database error');
      Session.findById.mockRejectedValue(error);

      // Execute
      await getSessionLeaderboard(req, res);

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching leaderboard:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching leaderboard',
        error
      });
    });
  });

  describe('getUserScoreAndRank', () => {
    const validSessionId = '507f1f77bcf86cd799439011';
    const validUserId = '507f1f77bcf86cd799439012';

    it('should get user score and rank successfully', async () => {
      // Setup
      req.params = { sessionId: validSessionId, userId: validUserId };

      const mockSession = {
        _id: validSessionId,
        title: 'Test Session'
      };

      const mockLeaderboardEntry = {
        player: {
          _id: validUserId,
          username: 'testuser',
          email: 'test@test.com',
          mobile: '1234567890'
        },
        score: 95,
        rank: 3
      };

      Session.findById.mockResolvedValue(mockSession);
      Leaderboard.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockLeaderboardEntry)
      });

      // Execute
      await getUserScoreAndRank(req, res);

      // Assert
      expect(Session.findById).toHaveBeenCalledWith(validSessionId);
      expect(Leaderboard.findOne).toHaveBeenCalledWith({
        session: validSessionId,
        player: validUserId
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User score and rank fetched successfully',
        user: {
          user: mockLeaderboardEntry.player,
          totalPoints: mockLeaderboardEntry.score,
          rank: mockLeaderboardEntry.rank
        }
      });
    });

    it('should return 400 for invalid IDs', async () => {
      // Setup
      const invalidCases = [
        { sessionId: 'invalid-id', userId: validUserId },
        { sessionId: validSessionId, userId: 'invalid-id' },
        { sessionId: 'invalid-id', userId: 'invalid-id' }
      ];

      for (const params of invalidCases) {
        req.params = params;

        // Execute
        await getUserScoreAndRank(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Invalid session or user ID format'
        });
      }
    });

    it('should return 404 when session not found', async () => {
      // Setup
      req.params = { sessionId: validSessionId, userId: validUserId };
      Session.findById.mockResolvedValue(null);

      // Execute
      await getUserScoreAndRank(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Session not found'
      });
    });

    it('should return 404 when user not found in leaderboard', async () => {
      // Setup
      req.params = { sessionId: validSessionId, userId: validUserId };
      Session.findById.mockResolvedValue({ _id: validSessionId });
      Leaderboard.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await getUserScoreAndRank(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found in leaderboard for this session'
      });
    });

    it('should handle errors when fetching user score and rank', async () => {
      // Setup
      req.params = { sessionId: validSessionId, userId: validUserId };
      const error = new Error('Database error');
      Session.findById.mockRejectedValue(error);

      // Execute
      await getUserScoreAndRank(req, res);

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching user score and rank:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching user score and rank',
        error
      });
    });
  });
});