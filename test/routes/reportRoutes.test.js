const request = require('supertest');
const express = require('express');
const router = require('../../routes/reportRoutes');
const reportController = require('../../controllers/reportController');

// Mock the middlewares
jest.mock('../../middlewares/auth', () => ({
  auth: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock the reportController functions
jest.mock('../../controllers/reportController', () => ({
  getAllReports: jest.fn((req, res) => res.status(200).json({ message: 'All reports retrieved successfully' })),
  getUserReports: jest.fn((req, res) => res.status(200).json({ message: 'User reports retrieved successfully' })),
  getReportByQuiz: jest.fn((req, res) => res.status(200).json({ message: 'Report by quiz retrieved successfully' })),
  getUserReportByQuiz: jest.fn((req, res) => res.status(200).json({ message: 'User report by quiz retrieved successfully' })),
  getQuizStats: jest.fn((req, res) => res.status(200).json({ message: 'Quiz stats retrieved successfully' })),
}));

// Import the mocks after defining them
const { auth, isAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use('/api', router);

describe('Report Routes', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mock call counts after each test
  });

  // Test GET /api/reports
  it('should call getAllReports when a valid GET request is made to /api/reports', async () => {
    const res = await request(app).get('/api/reports');

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(reportController.getAllReports).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('All reports retrieved successfully');
  });

  // Test GET /api/reports/user/:userId
  it('should call getUserReports when a valid GET request is made to /api/reports/user/:userId', async () => {
    const userId = '123';
    const res = await request(app).get(`/api/reports/user/${userId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(0); // No isAdmin check for this route
    expect(reportController.getUserReports).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User reports retrieved successfully');
  });

  // Test GET /api/reports/:quizId
  it('should call getReportByQuiz when a valid GET request is made to /api/reports/:quizId', async () => {
    const quizId = '456';
    const res = await request(app).get(`/api/reports/${quizId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(reportController.getReportByQuiz).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Report by quiz retrieved successfully');
  });

  // Test GET /api/reports/:quizId/user/:userId
  it('should call getUserReportByQuiz when a valid GET request is made to /api/reports/:quizId/user/:userId', async () => {
    const quizId = '456';
    const userId = '123';
    const res = await request(app).get(`/api/reports/${quizId}/user/${userId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(0); // No isAdmin check for this route
    expect(reportController.getUserReportByQuiz).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User report by quiz retrieved successfully');
  });

  // Test GET /api/reports/:quizId/stats
  it('should call getQuizStats when a valid GET request is made to /api/reports/:quizId/stats', async () => {
    const quizId = '456';
    const res = await request(app).get(`/api/reports/${quizId}/stats`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(0); // No isAdmin check for this route
    expect(reportController.getQuizStats).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Quiz stats retrieved successfully');
  });
});
