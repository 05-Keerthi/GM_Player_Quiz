const mongoose = require('mongoose');
const Report = require('../../models/Report');
const User = require('../../models/User');

// Mock the dependencies
jest.mock('../../models/Report');
jest.mock('../../models/User');

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

  describe('getAllReports', () => {
    it('should get all reports successfully', async () => {
      // Setup
      const mockReports = [
        {
          _id: 'report1',
          quiz: 'quiz123',
          user: 'user123',
          totalQuestions: 10,
          correctAnswers: 8,
          incorrectAnswers: 2,
          totalScore: 80,
          completedAt: new Date('2024-01-01')
        },
        {
          _id: 'report2',
          quiz: 'quiz456',
          user: 'user456',
          totalQuestions: 15,
          correctAnswers: 12,
          incorrectAnswers: 3,
          totalScore: 85,
          completedAt: new Date('2024-01-02')
        }
      ];

      Report.find.mockReturnValue({
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
      expect(Report.find().populate).toHaveBeenCalledWith('quiz');
      expect(Report.find().populate).toHaveBeenCalledWith('user');
      expect(Report.find().sort).toHaveBeenCalledWith({ completedAt: -1 });
    });

    it('should return empty array message when no reports exist', async () => {
      // Setup
      Report.find.mockReturnValue({
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

    it('should handle errors when fetching all reports', async () => {
      // Setup
      const error = new Error('Database error');
      Report.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(error)
      });

      // Execute
      await getAllReports(req, res);

      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching reports:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getUserReports', () => {
    it('should get user reports successfully', async () => {
      // Setup
      const userId = 'user123';
      req.params = { userId };

      const mockUserReports = [
        {
          _id: 'report1',
          quiz: 'quiz123',
          user: userId,
          totalQuestions: 10,
          correctAnswers: 8,
          incorrectAnswers: 2,
          totalScore: 80,
          completedAt: new Date('2024-01-01')
        }
      ];

      Report.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockUserReports)
      });

      // Execute
      await getUserReports(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User reports fetched successfully',
        data: mockUserReports
      });
      expect(Report.find).toHaveBeenCalledWith({ user: userId });
    });

    it('should return empty array message when no reports exist for user', async () => {
      // Setup
      const userId = 'user123';
      req.params = { userId };

      Report.find.mockReturnValue({
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
      const quizId = 'quiz123';
      req.params = { quizId };

      const mockQuizReports = [
        {
          _id: 'report1',
          quiz: quizId,
          user: 'user123',
          totalQuestions: 10,
          correctAnswers: 8,
          incorrectAnswers: 2,
          totalScore: 80,
          completedAt: new Date('2024-01-01')
        }
      ];

      Report.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockQuizReports)
      });

      // Execute
      await getReportByQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Reports fetched successfully for the quiz',
        data: mockQuizReports
      });
      expect(Report.find).toHaveBeenCalledWith({ quiz: quizId });
    });

    it('should return empty array message when no reports exist for quiz', async () => {
      // Setup
      const quizId = 'quiz123';
      req.params = { quizId };

      Report.find.mockReturnValue({
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
    it('should get specific user quiz report successfully', async () => {
      // Setup
      const quizId = 'quiz123';
      const userId = 'user123';
      req.params = { quizId, userId };

      const mockReport = {
        _id: 'report1',
        quiz: quizId,
        user: userId,
        totalQuestions: 10,
        correctAnswers: 8,
        incorrectAnswers: 2,
        totalScore: 80,
        completedAt: new Date('2024-01-01')
      };

      // Fix: Properly chain the populate mocks
      Report.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockReport)
        })
      });

      // Execute
      await getUserReportByQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User report fetched successfully',
        data: mockReport
      });
      expect(Report.findOne).toHaveBeenCalledWith({ quiz: quizId, user: userId });
    });

    it('should return 404 when report not found', async () => {
      // Setup
      const quizId = 'quiz123';
      const userId = 'user123';
      req.params = { quizId, userId };

      // Fix: Properly chain the populate mocks for null return
      Report.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      // Execute
      await getUserReportByQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Report not found',
        data: null
      });
    });
  });

  describe('getQuizStats', () => {
    it('should calculate quiz statistics successfully', async () => {
      // Setup
      const quizId = 'quiz123';
      req.params = { quizId };

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
      expect(Report.find).toHaveBeenCalledWith({ quiz: quizId });
    });

    it('should return zero statistics when no reports exist', async () => {
      // Setup
      const quizId = 'quiz123';
      req.params = { quizId };

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