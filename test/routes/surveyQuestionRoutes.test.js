const request = require('supertest');
const express = require('express');
const router = require('../../routes/surveyQuestionRoutes');
const surveyController = require('../../controllers/surveyQuestionController');

// Mock middlewares
jest.mock('../../middlewares/auth', () => ({
    auth: jest.fn((req, res, next) => next()),
    isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/surveyQuestionController', () => ({
    createSurveyQuestion: jest.fn((req, res) => res.status(201).json({ message: 'Survey question created successfully' })),
    getSurveyQuestions: jest.fn((req, res) => res.status(200).json({ questions: [] })),
    getSurveyQuestionById: jest.fn((req, res) => res.status(200).json({ id: req.params.surveyquestionId, question: 'Sample Question' })),
    updateSurveyQuestionById: jest.fn((req, res) => res.status(200).json({ message: 'Survey question updated successfully' })),
    deleteSurveyQuestionById: jest.fn((req, res) => res.status(200).json({ message: 'Survey question deleted successfully' })),
}));

// Import the mocks after defining them
const { auth, isAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Survey Question Routes', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear mock call counts after each test
    });

    // Test POST /api/:surveyquizId/create-survey-question
    it('should call createSurveyQuestion when a valid POST request is made to /api/:surveyquizId/create-survey-question', async () => {
        const res = await request(app)
            .post('/api/1/create-survey-question')
            .send({ question: 'What is your favorite color?' });

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveyController.createSurveyQuestion).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Survey question created successfully');
    });

    // Test GET /api/:surveyquizId/survey-question
    it('should call getSurveyQuestions when a valid GET request is made to /api/:surveyquizId/survey-question', async () => {
        const res = await request(app).get('/api/1/survey-question');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(surveyController.getSurveyQuestions).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.questions).toEqual([]);
    });

    // Test GET /api/:surveyquizId/survey-question/:surveyquestionId
    it('should call getSurveyQuestionById when a valid GET request is made to /api/:surveyquizId/survey-question/:surveyquestionId', async () => {
        const res = await request(app).get('/api/1/survey-question/123');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(surveyController.getSurveyQuestionById).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.question).toBe('Sample Question');
    });

    // Test PUT /api/:surveyquizId/survey-question/:surveyquestionId
    it('should call updateSurveyQuestionById when a valid PUT request is made to /api/:surveyquizId/survey-question/:surveyquestionId', async () => {
        const res = await request(app)
            .put('/api/1/survey-question/123')
            .send({ question: 'Updated question?' });

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveyController.updateSurveyQuestionById).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Survey question updated successfully');
    });

    // Test DELETE /api/:surveyquizId/survey-question/:surveyquestionId
    it('should call deleteSurveyQuestionById when a valid DELETE request is made to /api/:surveyquizId/survey-question/:surveyquestionId', async () => {
        const res = await request(app).delete('/api/1/survey-question/123');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveyController.deleteSurveyQuestionById).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Survey question deleted successfully');
    });
});
