const mongoose = require('mongoose');
const Report = require('../../models/Report');
const User = require('../../models/User');
const Quiz = require('../../models/quiz');
const SurveyQuiz = require('../../models/SurveyQuiz');

// Mock all dependencies
jest.mock('../../models/Report');
jest.mock('../../models/User');
jest.mock('../../models/quiz');
jest.mock('../../models/SurveyQuiz');

const {
  getAllReports,
  getUserReports,
  getReportByQuiz,
  getUserReportByQuiz,
  getQuizStats
} = require('../../controllers/reportController');

describe('Report Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: {
        _id: 'user123',
        username: 'testuser'
      }
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

  describe('getAllReports', () => {
    it('should get all reports successfully', async () => {
      // Setup
      const mockReports = [
        {
          _id: 'report123',
          quiz: 'quiz123',
          user: 'user123',
          totalScore: 85
        }
      ];

      Report.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockReports)
      });

      // Execute
      await getAllReports(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All reports fetched successfully',
        data: mockReports
      });
    });

    it('should return empty array when no reports exist', async () => {
      // Setup
      Report.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      // Execute
      await getAllReports(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No reports available',
        data: []
      });
    });
  });

  describe('getUserReports', () => {
    it('should get user reports successfully', async () => {
      // Setup
      req.params.userId = 'user123';
      const mockReports = [
        {
          _id: 'report123',
          quiz: 'quiz123',
          user: 'user123',
          totalScore: 85
        }
      ];

      Report.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockReports)
      });

      // Execute
      await getUserReports(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User reports fetched successfully',
        data: mockReports
      });
    });

    it('should return empty array when user has no reports', async () => {
      // Setup
      req.params.userId = 'user123';
      Report.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      // Execute
      await getUserReports(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No reports found for this user',
        data: []
      });
    });
  });

  describe('getReportByQuiz', () => {
    it('should get quiz reports successfully', async () => {
      // Setup
      req.params.quizId = 'quiz123';
      const mockReports = [
        {
          _id: 'report123',
          quiz: 'quiz123',
          user: 'user123',
          totalScore: 85
        }
      ];

      Report.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockReports)
      });

      // Execute
      await getReportByQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Reports fetched successfully for the quiz',
        data: mockReports
      });
    });

    it('should return empty array when quiz has no reports', async () => {
      // Setup
      req.params.quizId = 'quiz123';
      Report.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      // Execute
      await getReportByQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No reports found for this quiz',
        data: []
      });
    });
  });

  describe('getUserReportByQuiz', () => {
    it('should get user quiz report successfully', async () => {
      // Setup
      req.params = { quizId: 'quiz123', userId: 'user123' };
      const mockReport = {
        _id: 'report123',
        quiz: 'quiz123',
        user: 'user123',
        totalScore: 85
      };

      Report.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockReport)
      });

      // Execute
      await getUserReportByQuiz(req, res);
    });

    it('should return 404 when report not found', async () => {
      // Setup
      req.params = { quizId: 'quiz123', userId: 'user123' };
      Report.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await getUserReportByQuiz(req, res);
    });
  });

  describe('getQuizStats', () => {
    it('should get quiz statistics successfully', async () => {
      // Setup
      req.params.quizId = 'quiz123';
      const mockReports = [
        { totalScore: 85 },
        { totalScore: 90 },
        { totalScore: 75 }
      ];

      Report.find.mockResolvedValue(mockReports);

      // Execute
      await getQuizStats(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz statistics fetched successfully',
        data: {
          totalAttempts: 3,
          averageScore: '83.33',
          passRate: '66.67'
        }
      });
    });

    it('should return zero statistics when no reports exist', async () => {
      // Setup
      req.params.quizId = 'quiz123';
      Report.find.mockResolvedValue([]);

      // Execute
      await getQuizStats(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No statistics available for this quiz',
        data: {
          totalAttempts: 0,
          averageScore: 0,
          passRate: 0
        }
      });
    });
  });
});