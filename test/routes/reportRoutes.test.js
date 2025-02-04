const request = require('supertest');
const express = require('express');
const router = require('../../routes/reportRoutes');
const reportController = require('../../controllers/reportController');

// Mock the middlewares
jest.mock('../../middlewares/auth', () => ({
  auth: jest.fn((req, res, next) => next()),
  isAdminOrTenantAdmin: jest.fn((req, res, next) => next()),
}));

// Mock the reportController functions
jest.mock('../../controllers/reportController', () => ({
  getParticipatedQuizzesAndSurveys: jest.fn((req, res) => res.status(200).json({ message: 'Participated quizzes retrieved successfully' })),
  getQuizAttempts: jest.fn((req, res) => res.status(200).json({ message: 'Quiz attempts retrieved successfully' })),
  getSurveyAttempts: jest.fn((req, res) => res.status(200).json({ message: 'Survey attempts retrieved successfully' })),
  getSessionResponses: jest.fn((req, res) => res.status(200).json({ message: 'Session responses retrieved successfully' })),
  getSurveyResponses: jest.fn((req, res) => res.status(200).json({ message: 'Survey responses retrieved successfully' })),
  getOverallAnalytics: jest.fn((req, res) => res.status(200).json({ message: 'Overall analytics retrieved successfully' })),
  getQuizAnalytics: jest.fn((req, res) => res.status(200).json({ message: 'Quiz analytics retrieved successfully' })),
  getQuizDetailedAnalytics: jest.fn((req, res) => res.status(200).json({ message: 'Quiz detailed analytics retrieved successfully' })),
  getQuizSessionAnalytics: jest.fn((req, res) => res.status(200).json({ message: 'Quiz session analytics retrieved successfully' })),
  getSurveyAnalytics: jest.fn((req, res) => res.status(200).json({ message: 'Survey analytics retrieved successfully' })),
  getSurveyDetailedAnalytics: jest.fn((req, res) => res.status(200).json({ message: 'Survey detailed analytics retrieved successfully' })),
  getSurveySessionAnalytics: jest.fn((req, res) => res.status(200).json({ message: 'Survey session analytics retrieved successfully' })),
}));

// Import the mocks after defining them
const { auth, isAdminOrTenantAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Report Routes', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mock call counts after each test
  });

  // Test GET /api/reports/participated
  it('should call getParticipatedQuizzesAndSurveys when GET request is made to /api/reports/participated', async () => {
    const res = await request(app).get('/api/reports/participated');
    expect(auth).toHaveBeenCalledTimes(1);
    expect(reportController.getParticipatedQuizzesAndSurveys).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Participated quizzes retrieved successfully');
  });

  // Test GET /api/reports/quiz/:quizId/attempts
  it('should call getQuizAttempts when GET request is made to /api/reports/quiz/:quizId/attempts', async () => {
    const quizId = '123';
    const res = await request(app).get(`/api/reports/quiz/${quizId}/attempts`);
    expect(auth).toHaveBeenCalledTimes(1);
    expect(reportController.getQuizAttempts).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Quiz attempts retrieved successfully');
  });

  // Test GET /api/reports/survey/:surveyId/attempts
  it('should call getSurveyAttempts when GET request is made to /api/reports/survey/:surveyId/attempts', async () => {
    const surveyId = '123';
    const res = await request(app).get(`/api/reports/survey/${surveyId}/attempts`);
    expect(auth).toHaveBeenCalledTimes(1);
    expect(reportController.getSurveyAttempts).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Survey attempts retrieved successfully');
  });

  // Test GET /api/reports/session/:sessionId/responses
  it('should call getSessionResponses when GET request is made to /api/reports/session/:sessionId/responses', async () => {
    const sessionId = '123';
    const res = await request(app).get(`/api/reports/session/${sessionId}/responses`);
    expect(auth).toHaveBeenCalledTimes(1);
    expect(reportController.getSessionResponses).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Session responses retrieved successfully');
  });

  // Test GET /api/reports/surveySession/:surveySessionId/responses
  it('should call getSurveyResponses when GET request is made to /api/reports/surveySession/:surveySessionId/responses', async () => {
    const surveySessionId = '123';
    const res = await request(app).get(`/api/reports/surveySession/${surveySessionId}/responses`);
    expect(auth).toHaveBeenCalledTimes(1);
    expect(reportController.getSurveyResponses).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Survey responses retrieved successfully');
  });

  // Admin Analytics Routes Tests
  describe('Admin Analytics Routes', () => {
    it('should call getOverallAnalytics when GET request is made to /api/admin/analytics/overall', async () => {
      const res = await request(app).get('/api/admin/analytics/overall');
      expect(auth).toHaveBeenCalledTimes(1);
      expect(isAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
      expect(reportController.getOverallAnalytics).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Overall analytics retrieved successfully');
    });

    it('should call getQuizAnalytics when GET request is made to /api/admin/analytics/quizzes', async () => {
      const res = await request(app).get('/api/admin/analytics/quizzes');
      expect(auth).toHaveBeenCalledTimes(1);
      expect(isAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
      expect(reportController.getQuizAnalytics).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Quiz analytics retrieved successfully');
    });

    it('should call getQuizDetailedAnalytics when GET request is made to /api/admin/analytics/quizzes/:quizId', async () => {
      const quizId = '123';
      const res = await request(app).get(`/api/admin/analytics/quizzes/${quizId}`);
      expect(auth).toHaveBeenCalledTimes(1);
      expect(isAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
      expect(reportController.getQuizDetailedAnalytics).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Quiz detailed analytics retrieved successfully');
    });

    it('should call getQuizSessionAnalytics when GET request is made to /api/admin/analytics/quizzes/session/:sessionId', async () => {
      const sessionId = '123';
      const res = await request(app).get(`/api/admin/analytics/quizzes/session/${sessionId}`);
      expect(auth).toHaveBeenCalledTimes(1);
      expect(isAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
      expect(reportController.getQuizSessionAnalytics).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Quiz session analytics retrieved successfully');
    });

    it('should call getSurveyAnalytics when GET request is made to /api/admin/analytics/surveys', async () => {
      const res = await request(app).get('/api/admin/analytics/surveys');
      expect(auth).toHaveBeenCalledTimes(1);
      expect(isAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
      expect(reportController.getSurveyAnalytics).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Survey analytics retrieved successfully');
    });

    it('should call getSurveyDetailedAnalytics when GET request is made to /api/admin/analytics/surveys/:surveyId', async () => {
      const surveyId = '123';
      const res = await request(app).get(`/api/admin/analytics/surveys/${surveyId}`);
      expect(auth).toHaveBeenCalledTimes(1);
      expect(isAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
      expect(reportController.getSurveyDetailedAnalytics).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Survey detailed analytics retrieved successfully');
    });

    it('should call getSurveySessionAnalytics when GET request is made to /api/admin/analytics/surveys/session/:sessionId', async () => {
      const sessionId = '123';
      const res = await request(app).get(`/api/admin/analytics/surveys/session/${sessionId}`);
      expect(auth).toHaveBeenCalledTimes(1);
      expect(isAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
      expect(reportController.getSurveySessionAnalytics).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Survey session analytics retrieved successfully');
    });
  });
});