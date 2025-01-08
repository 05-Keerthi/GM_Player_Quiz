const request = require('supertest');
const express = require('express');
const router = require('../../routes/ActivityLogRoutes');
const {
  getAllActivityLogs,
  getUserActivityLogs,
} = require('../../controllers/ActivityLogController');

// Mock the controller functions
jest.mock('../../controllers/ActivityLogController', () => ({
  getAllActivityLogs: jest.fn(),
  getUserActivityLogs: jest.fn(),
}));

// Mock the authentication middleware
const authMock = jest.fn((req, res, next) => next());
const isAdminMock = jest.fn((req, res, next) => next());

// Replace the original middlewares with mocks
// Mock the authentication middleware
jest.mock('../../middlewares/auth', () => {
    const authMock = jest.fn((req, res, next) => next());
    const isAdminMock = jest.fn((req, res, next) => next());
  
    return {
      auth: authMock,
      isAdmin: isAdminMock,
    };
  });
  
  // Create a test app with the router and add the /api prefix
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  
  describe('ActivityLogRoutes', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    test('GET /api/activity-logs - should call getAllActivityLogs', async () => {
      getAllActivityLogs.mockImplementation((req, res) =>
        res.status(200).json({ message: 'All logs fetched' })
      );
  
      const response = await request(app).get('/api/activity-logs');
  
      expect(getAllActivityLogs).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('All logs fetched');
    });
  
    test('GET /api/activity-logs/:userId - should call getUserActivityLogs', async () => {
      getUserActivityLogs.mockImplementation((req, res) =>
        res.status(200).json({ message: `Logs for user ${req.params.userId} fetched` })
      );
  
      const userId = '12345';
      const response = await request(app).get(`/api/activity-logs/${userId}`);
  
      expect(getUserActivityLogs).toHaveBeenCalledWith(
        expect.objectContaining({ params: { userId } }),
        expect.any(Object),
        expect.any(Function)
      );
      expect(response.status).toBe(200);
      expect(response.body.message).toBe(`Logs for user ${userId} fetched`);
    });
  });