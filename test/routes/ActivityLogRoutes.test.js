const request = require('supertest');
const express = require('express');
const router = require('../../routes/activityLogRoutes');
const activityLogController = require('../../controllers/ActivityLogController');

// Mock the middlewares
jest.mock('../../middlewares/auth', () => ({
  auth: jest.fn((req, res, next) => next()),
  isAdminOrTenantAdmin: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock the activityLogController functions
jest.mock('../../controllers/ActivityLogController', () => ({
  getAllActivityLogs: jest.fn((req, res) => res.status(200).json({ message: 'All activity logs retrieved successfully' })),
  getUserActivityLogs: jest.fn((req, res) => res.status(200).json({ message: 'User activity logs retrieved successfully' })),
}));

// Import the mocks after defining them
const { auth, isAdminOrTenantAdmin, isAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Activity Log Routes', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mock call counts after each test
  });

  // Test GET /api/activity-logs
  it('should call getAllActivityLogs when a valid GET request is made to /api/activity-logs', async () => {
    const res = await request(app).get('/api/activity-logs');

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
    expect(activityLogController.getAllActivityLogs).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('All activity logs retrieved successfully');
  });

  // Test GET /api/activity-logs/:userId
  it('should call getUserActivityLogs when a valid GET request is made to /api/activity-logs/:userId', async () => {
    const userId = '123';
    const res = await request(app).get(`/api/activity-logs/${userId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(activityLogController.getUserActivityLogs).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('User activity logs retrieved successfully');
  });
});