const request = require('supertest');
const express = require('express');
const router = require('../../routes/notificationRoutes');
const notificationController = require('../../controllers/notificationController');

// Mock the middlewares
jest.mock('../../middlewares/auth', () => ({
    auth: jest.fn((req, res, next) => next()),
    isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock the notificationController functions
jest.mock('../../controllers/notificationController', () => ({
    createNotification: jest.fn((req, res) => res.status(201).json({ message: 'Notification created successfully' })),
    getNotificationsByUserId: jest.fn((req, res) => res.status(200).json({ message: 'Notifications retrieved successfully' })),
    markAsRead: jest.fn((req, res) => res.status(200).json({ message: 'Notification marked as read' })),
    deleteNotification: jest.fn((req, res) => res.status(200).json({ message: 'Notification deleted successfully' })),
}));

// Import the mocks after defining them
const { auth, isAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Notification Routes', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear mock call counts after each test
    });

    // Test POST /api/notifications
    it('should call createNotification when a valid POST request is made to /api/notifications', async () => {
        const res = await request(app).post('/api/notifications');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(notificationController.createNotification).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Notification created successfully');
    });

    // Test GET /api/notifications/:userId
    it('should call getNotificationsByUserId when a valid GET request is made to /api/notifications/:userId', async () => {
        const res = await request(app).get('/api/notifications/1');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(notificationController.getNotificationsByUserId).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Notifications retrieved successfully');
    });

    // Test PUT /api/notifications/:id
    it('should call markAsRead when a valid PUT request is made to /api/notifications/:id', async () => {
        const res = await request(app).put('/api/notifications/1');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(notificationController.markAsRead).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Notification marked as read');
    });

    // Test DELETE /api/notifications/:id
    it('should call deleteNotification when a valid DELETE request is made to /api/notifications/:id', async () => {
        const res = await request(app).delete('/api/notifications/1');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(notificationController.deleteNotification).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Notification deleted successfully');
    });
});
