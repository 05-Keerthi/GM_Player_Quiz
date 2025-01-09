const request = require('supertest');
const express = require('express');
const router = require('../../routes/surveyNotificationRoutes');
const surveyNotificationController = require('../../controllers/surveyNotificationController');

// Mock middlewares
jest.mock('../../middlewares/auth', () => ({
    auth: jest.fn((req, res, next) => next()),
    isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/surveyNotificationController', () => ({
    createSurveyNotification: jest.fn((req, res) => res.status(201).json({ message: 'Notification created successfully' })),
    getSurveyNotificationsByUserId: jest.fn((req, res) => res.status(200).json({ notifications: [] })),
    markSurveyNotificationAsRead: jest.fn((req, res) => res.status(200).json({ message: 'Notification marked as read' })),
    deleteSurveyNotification: jest.fn((req, res) => res.status(200).json({ message: 'Notification deleted successfully' })),
}));

// Import the mocks after defining them
const { auth, isAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Survey Notification Routes', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear mock call counts after each test
    });

    // Test POST /api/survey-notifications
    it('should call createSurveyNotification when a valid POST request is made to /api/survey-notifications', async () => {
        const res = await request(app)
            .post('/api/survey-notifications')
            .send({ title: 'New Survey Available', message: 'Please participate' });

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveyNotificationController.createSurveyNotification).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Notification created successfully');
    });

    // Test GET /api/survey-notifications/:userId
    it('should call getSurveyNotificationsByUserId when a valid GET request is made to /api/survey-notifications/:userId', async () => {
        const res = await request(app).get('/api/survey-notifications/1');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(surveyNotificationController.getSurveyNotificationsByUserId).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.notifications).toEqual([]);
    });

    // Test PUT /api/survey-notifications/:id
    it('should call markSurveyNotificationAsRead when a valid PUT request is made to /api/survey-notifications/:id', async () => {
        const res = await request(app).put('/api/survey-notifications/123');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(surveyNotificationController.markSurveyNotificationAsRead).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Notification marked as read');
    });

    // Test DELETE /api/survey-notifications/:id
    it('should call deleteSurveyNotification when a valid DELETE request is made to /api/survey-notifications/:id', async () => {
        const res = await request(app).delete('/api/survey-notifications/123');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveyNotificationController.deleteSurveyNotification).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Notification deleted successfully');
    });
});
