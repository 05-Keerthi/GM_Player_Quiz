const mongoose = require('mongoose');
const Report = require('../../models/Report');
const Quiz = require('../../models/quiz');
const SurveyQuiz = require('../../models/surveyQuiz');
const Session = require('../../models/session');
const Leaderboard = require('../../models/leaderBoard');
const SurveySession = require('../../models/surveysession');
const User = require('../../models/User');
const Answer = require('../../models/answer');
const SurveyAnswer = require('../../models/surveyanswer');
const Media = require('../../models/Media');

// Mock all dependencies
jest.mock('../../models/Report');
jest.mock('../../models/quiz');
jest.mock('../../models/surveyQuiz');
jest.mock('../../models/session');
jest.mock('../../models/leaderBoard');
jest.mock('../../models/surveysession');
jest.mock('../../models/User');
jest.mock('../../models/answer');
jest.mock('../../models/surveyanswer');
jest.mock('../../models/Media');

const {
  getParticipatedQuizzesAndSurveys,
  getQuizAttempts,
  getSurveyAttempts,
  getSessionResponses,
  getSurveyResponses,
  getOverallAnalytics,
  getQuizAnalytics,
  getQuizDetailedAnalytics,
  getQuizSessionAnalytics,
  getSurveyAnalytics,
  getSurveyDetailedAnalytics,
  getSurveySessionAnalytics
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
      },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:5000')
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

  describe('getParticipatedQuizzesAndSurveys', () => {
    it('should get participated quizzes and surveys successfully', async () => {
      // Mock aggregation results
      Session.aggregate.mockResolvedValue([{ totalTime: 3600 }]);
      SurveySession.aggregate.mockResolvedValue([{ totalTime: 1800 }]);
      Report.aggregate
        .mockResolvedValueOnce([{ // Quiz results
          QuizId: 'quiz123',
          attempts: 5,
          totalTimeTaken: 300
        }])
        .mockResolvedValueOnce([{ // Survey results
          SurveyId: 'survey123',
          attempts: 3,
          totalTimeTaken: 200
        }]);

      await getParticipatedQuizzesAndSurveys(req, res);

      expect(res.json).toHaveBeenCalledWith({
        totalTime: 5400, // 3600 + 1800
        quizzes: expect.any(Array),
        surveys: expect.any(Array)
      });
    });

    it('should handle errors', async () => {
      Session.aggregate.mockRejectedValue(new Error('Database error'));

      await getParticipatedQuizzesAndSurveys(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.any(String)
      });
    });
  });

  describe('getQuizAttempts', () => {
    it('should get quiz attempts successfully', async () => {
      req.params.quizId = 'quiz123';

      Report.aggregate.mockResolvedValue([{
        _id: 'attempt123',
        sessionDetails: {
          quiz: {
            _id: 'quiz123',
            quizTitle: 'Test Quiz'
          }
        }
      }]);

      await getQuizAttempts(req, res);

    });

    it('should handle errors', async () => {
      req.params.quizId = 'quiz123';
      Report.aggregate.mockRejectedValue(new Error('Database error'));

      await getQuizAttempts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getSessionResponses', () => {
    it('should get session responses successfully', async () => {
      req.params.sessionId = 'session123';

      const mockAnswers = [{
        question: 'Test Question',
        originalImageUrl: 'media123'
      }];

      Answer.aggregate.mockResolvedValue(mockAnswers);
      Media.findById.mockResolvedValue({ path: 'uploads\\test-image.jpg' });
      Report.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          score: 80,
          timeTaken: 300
        })
      });
      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          joinCode: 'ABC123',
          status: 'completed'
        })
      });

      await getSessionResponses(req, res);

    });
  });

  describe('getOverallAnalytics', () => {
    it('should get overall analytics successfully', async () => {
      User.countDocuments.mockResolvedValue(100);
      Quiz.countDocuments.mockResolvedValue(50);
      SurveyQuiz.countDocuments.mockResolvedValue(30);
      Session.countDocuments
        .mockResolvedValueOnce(200) // Total sessions
        .mockResolvedValueOnce(10); // Active sessions
      Report.countDocuments.mockResolvedValue(500);
      SurveySession.countDocuments.mockResolvedValue(5);
      User.aggregate.mockResolvedValue([{
        _id: { year: 2024, month: 1 },
        count: 20
      }]);

      await getOverallAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith({
        overview: expect.objectContaining({
          totalUsers: 100,
          totalQuizzes: 50,
          totalSurveys: 30,
          totalSessions: 200,
          totalReports: 500,
          activeSessions: 10,
          activeSurveySessions: 5
        }),
        userTrend: expect.any(Array)
      });
    });
  });

  describe('getQuizDetailedAnalytics', () => {
    it('should get detailed quiz analytics successfully', async () => {
      req.params.quizId = 'quiz123';

      Quiz.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          title: 'Test Quiz',
          categories: [{ name: 'Category 1' }]
        })
      });

      Leaderboard.aggregate
        .mockResolvedValueOnce([{ // Overall stats
          totalAttempts: 50,
          participantCount: 30
        }])
        .mockResolvedValueOnce([{ // Top performers
          username: 'topuser',
          score: 95
        }]);

      Session.aggregate.mockResolvedValue([{
        status: 'completed',
        count: 20
      }]);

      Session.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{
          joinCode: 'ABC123',
          players: ['player1', 'player2']
        }])
      });

      await getQuizDetailedAnalytics(req, res);
    });

    it('should handle invalid quiz ID', async () => {
      req.params.quizId = 'invalid';

      await getQuizDetailedAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid quiz ID'
      });
    });
  });
});