const mongoose = require('mongoose');
const ActivityLog = require('../../models/ActivityLog');
const Quiz = require('../../models/quiz');
const SurveyQuiz = require('../../models/surveyQuiz');
const Session = require('../../models/session');
const SurveySession = require('../../models/surveysession');

// Mock all required models
jest.mock('../../models/ActivityLog');
jest.mock('../../models/quiz');
jest.mock('../../models/surveyQuiz');
jest.mock('../../models/session');
jest.mock('../../models/surveysession');

const {
  getAllActivityLogs,
  getUserActivityLogs
} = require('../../controllers/ActivityLogController');

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

describe('ActivityLog Controller', () => {
  let req;
  let res;
  
  beforeEach(() => {
    req = {
      query: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllActivityLogs', () => {
    const mockActivityLogs = [
      { _id: '1', activityType: 'login', createdAt: new Date() }
    ];

    const mockAggregateCounts = [
      { _id: 'login', count: 5 },
      { _id: 'quiz_create', count: 3 }
    ];

    const mockQuizCounts = [
      { _id: 'draft', count: 2 },
      { _id: 'active', count: 3 }
    ];

    const mockSessionCounts = [
      { _id: 'waiting', count: 1 },
      { _id: 'completed', count: 4 }
    ];

    const mockSurveySessionCounts = [
      { _id: 'waiting', count: 2 },
      { _id: 'in_progress', count: 3 }
    ];

    const mockSurveyQuizCounts = [
      { _id: { type: 'survey', status: 'draft' }, count: 1 },
      { _id: { type: 'ArtPulse', status: 'active' }, count: 2 }
    ];

    beforeEach(() => {
      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockActivityLogs)
      });
      ActivityLog.aggregate.mockResolvedValue(mockAggregateCounts);
      Quiz.aggregate.mockResolvedValue(mockQuizCounts);
      Session.aggregate.mockResolvedValue(mockSessionCounts);
      SurveySession.aggregate.mockResolvedValue(mockSurveySessionCounts);
      SurveyQuiz.aggregate.mockResolvedValue(mockSurveyQuizCounts);
    });

    test('should fetch all activity logs with no filters', async () => {
      await getAllActivityLogs(req, res);

      expect(ActivityLog.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        activityLogs: mockActivityLogs,
        counts: expect.any(Object)
      }));
    });

    test('should handle day filter', async () => {
      req.query.filter = 'day';
      await getAllActivityLogs(req, res);

      expect(ActivityLog.find).toHaveBeenCalledWith(expect.objectContaining({
        createdAt: expect.any(Object)
      }));
    });

    test('should handle date range filter', async () => {
      req.query.startDate = '2024-01-01';
      req.query.endDate = '2024-01-31';
      await getAllActivityLogs(req, res);

      expect(ActivityLog.find).toHaveBeenCalledWith(expect.objectContaining({
        createdAt: {
          $gte: expect.any(Date),
          $lte: expect.any(Date)
        }
      }));
    });

    test('should handle error case', async () => {
      const error = new Error('Database error');
      ActivityLog.find.mockImplementation(() => {
        throw error;
      });

      await getAllActivityLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching logs',
        error
      });
    });
  });

  describe('getUserActivityLogs', () => {
    const mockUserLogs = [
      { _id: '1', user: 'user123', activityType: 'login' }
    ];

    beforeEach(() => {
      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockUserLogs)
      });
    });

    test('should fetch logs for specific user', async () => {
      req.params.userId = 'user123';
      await getUserActivityLogs(req, res);

      expect(ActivityLog.find).toHaveBeenCalledWith({ user: 'user123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        activityLogs: mockUserLogs
      });
    });

    test('should handle no logs found for user', async () => {
      ActivityLog.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([])
      });

      req.params.userId = 'user123';
      await getUserActivityLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No activity logs for this user.',
        activityLogs: []
      });
    });

    test('should handle error case', async () => {
      const error = new Error('Database error');
      ActivityLog.find.mockImplementation(() => {
        throw error;
      });

      req.params.userId = 'user123';
      await getUserActivityLogs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching user activity logs',
        error
      });
    });
  });
});