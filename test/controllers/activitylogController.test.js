const mongoose = require('mongoose');
const ActivityLog = require('../../models/ActivityLog');
const User = require('../../models/User');

// Mock the dependencies
jest.mock('../../models/ActivityLog');
jest.mock('../../models/User');

const {
  getAllActivityLogs,
  getUserActivityLogs
} = require('../../controllers/ActivityLogController');



describe('ActivityLog Controller', () => {
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

  describe('getAllActivityLogs', () => {
    it('should get all activity logs successfully with various activity types', async () => {
      // Setup
      const mockLogs = [
        {
          _id: 'log1',
          user: 'user123',
          activityType: 'quiz_create',
          details: new Map([
            ['quizId', 'quiz123'],
            ['quizTitle', 'Mathematics Quiz']
          ]),
          createdAt: new Date('2024-01-01')
        },
        {
          _id: 'log2',
          user: 'user456',
          activityType: 'quiz_play',
          details: new Map([
            ['quizId', 'quiz789'],
            ['score', '85']
          ]),
          createdAt: new Date('2024-01-02')
        },
        {
          _id: 'log3',
          user: 'user789',
          activityType: 'subscription_change',
          details: new Map([
            ['oldPlan', 'basic'],
            ['newPlan', 'premium']
          ]),
          createdAt: new Date('2024-01-03')
        }
      ];

      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockLogs)
      });

      // Execute
      await getAllActivityLogs(req, res);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith('Fetching all activity logs...');
      expect(mockConsoleLog).toHaveBeenCalledWith('Logs fetched:', mockLogs);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        activityLogs: mockLogs
      });
      expect(ActivityLog.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should return empty array message when no logs exist', async () => {
      // Setup
      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      // Execute
      await getAllActivityLogs(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No activity logs found.',
        activityLogs: []
      });
    });

    it('should handle errors when fetching all logs', async () => {
      // Setup
      const error = new Error('Database error');
      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(error)
      });

      // Execute
      await getAllActivityLogs(req, res);

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching all logs:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching logs',
        error
      });
    });
  });

  describe('getUserActivityLogs', () => {
    it('should get user activity logs successfully with different activity types', async () => {
      // Setup
      const userId = 'user123';
      req.params = { userId };

      const mockUserLogs = [
        {
          _id: 'log1',
          user: userId,
          activityType: 'login',
          details: new Map([
            ['device', 'mobile'],
            ['browser', 'chrome']
          ]),
          createdAt: new Date('2024-01-01')
        },
        {
          _id: 'log2',
          user: userId,
          activityType: 'quiz_share',
          details: new Map([
            ['quizId', 'quiz456'],
            ['sharedWith', 'user789']
          ]),
          createdAt: new Date('2024-01-02')
        }
      ];

      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockUserLogs)
      });

      // Execute
      await getUserActivityLogs(req, res);

      // Assert
      expect(mockConsoleLog).toHaveBeenCalledWith('Fetching activity logs for userId:', userId);
      expect(mockConsoleLog).toHaveBeenCalledWith('Logs fetched:', mockUserLogs);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        activityLogs: mockUserLogs
      });
      expect(ActivityLog.find).toHaveBeenCalledWith({ user: userId });
      expect(ActivityLog.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should return empty array message when no logs exist for user', async () => {
      // Setup
      const userId = 'user123';
      req.params = { userId };

      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      // Execute
      await getUserActivityLogs(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No activity logs for this user.',
        activityLogs: []
      });
      expect(ActivityLog.find).toHaveBeenCalledWith({ user: userId });
    });

    it('should handle errors when fetching user logs', async () => {
      // Setup
      const userId = 'user123';
      req.params = { userId };
      const error = new Error('Database error');

      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(error)
      });

      // Execute
      await getUserActivityLogs(req, res);

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching user logs:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching user activity logs',
        error
      });
    });
  });
});