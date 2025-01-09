const request = require('supertest');
const express = require('express');
const router = require('../../routes/surveySessionRoutes');
const surveySessionController = require('../../controllers/surveySessionController');

// Mock middlewares
jest.mock('../../middlewares/auth', () => ({
    auth: jest.fn((req, res, next) => next()),
    isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/surveySessionController', () => ({
    createSurveySession: jest.fn((req, res) => res.status(201).json({ message: 'Survey session created successfully' })),
    joinSurveySession: jest.fn((req, res) => res.status(200).json({ message: 'Joined survey session successfully' })),
    startSurveySession: jest.fn((req, res) => res.status(200).json({ message: 'Survey session started successfully' })),
    nextSurveyQuestion: jest.fn((req, res) => res.status(200).json({ message: 'Next survey question retrieved successfully' })),
    endSurveySession: jest.fn((req, res) => res.status(200).json({ message: 'Survey session ended successfully' })),
}));

// Import the mocks after defining them
const { auth, isAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Survey Session Routes', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear mock call counts after each test
    });

    // Test POST /api/survey-sessions/:surveyQuizId/create
    it('should call createSurveySession when a valid POST request is made to /api/survey-sessions/:surveyQuizId/create', async () => {
        const res = await request(app)
            .post('/api/survey-sessions/1/create')
            .send({ name: 'New Survey Session' });

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveySessionController.createSurveySession).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Survey session created successfully');
    });

    // Test POST /api/survey-sessions/:joinCode/join
    it('should call joinSurveySession when a valid POST request is made to /api/survey-sessions/:joinCode/join', async () => {
        const res = await request(app)
            .post('/api/survey-sessions/ABCD123/join')
            .send({ userId: 1 });

        expect(auth).toHaveBeenCalledTimes(1);
        expect(surveySessionController.joinSurveySession).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Joined survey session successfully');
    });

    // Test POST /api/survey-sessions/:joinCode/:sessionId/start
    it('should call startSurveySession when a valid POST request is made to /api/survey-sessions/:joinCode/:sessionId/start', async () => {
        const res = await request(app)
            .post('/api/survey-sessions/ABCD123/1/start');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveySessionController.startSurveySession).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Survey session started successfully');
    });

    // Test POST /api/survey-sessions/:joinCode/:sessionId/next
    it('should call nextSurveyQuestion when a valid POST request is made to /api/survey-sessions/:joinCode/:sessionId/next', async () => {
        const res = await request(app)
            .post('/api/survey-sessions/ABCD123/1/next');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveySessionController.nextSurveyQuestion).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Next survey question retrieved successfully');
    });

    // Test POST /api/survey-sessions/:joinCode/:sessionId/end
    it('should call endSurveySession when a valid POST request is made to /api/survey-sessions/:joinCode/:sessionId/end', async () => {
        const res = await request(app)
            .post('/api/survey-sessions/ABCD123/1/end');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveySessionController.endSurveySession).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Survey session ended successfully');
    });
});
