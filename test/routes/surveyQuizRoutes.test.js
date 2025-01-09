const request = require('supertest');
const express = require('express');
const router = require('../../routes/surveyQuizRoutes');
const surveyQuizController = require('../../controllers/surveyQuizController');

// Mock middlewares
jest.mock('../../middlewares/auth', () => ({
    auth: jest.fn((req, res, next) => next()),
    isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/surveyQuizController', () => ({
    createSurveyQuiz: jest.fn((req, res) => res.status(201).json({ message: 'Survey quiz created successfully' })),
    getAllSurveyQuizzes: jest.fn((req, res) => res.status(200).json({ quizzes: [] })),
    getSurveyQuizById: jest.fn((req, res) => res.status(200).json({ id: req.params.id, title: 'Sample Quiz' })),
    updateSurveyQuiz: jest.fn((req, res) => res.status(200).json({ message: 'Survey quiz updated successfully' })),
    deleteSurveyQuiz: jest.fn((req, res) => res.status(200).json({ message: 'Survey quiz deleted successfully' })),
    publishSurveyQuiz: jest.fn((req, res) => res.status(200).json({ message: 'Survey quiz published successfully' })),
    closeSurveyQuiz: jest.fn((req, res) => res.status(200).json({ message: 'Survey quiz closed successfully' })),
}));

// Import the mocks after defining them
const { auth, isAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Survey Quiz Routes', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear mock call counts after each test
    });

    // Test POST /api/survey-quiz
    it('should call createSurveyQuiz when a valid POST request is made to /api/survey-quiz', async () => {
        const res = await request(app)
            .post('/api/survey-quiz')
            .send({ title: 'New Survey Quiz', description: 'Sample description' });

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveyQuizController.createSurveyQuiz).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Survey quiz created successfully');
    });

    // Test GET /api/survey-quiz
    it('should call getAllSurveyQuizzes when a valid GET request is made to /api/survey-quiz', async () => {
        const res = await request(app).get('/api/survey-quiz');

        expect(surveyQuizController.getAllSurveyQuizzes).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.quizzes).toEqual([]);
    });

    // Test GET /api/survey-quiz/:id
    it('should call getSurveyQuizById when a valid GET request is made to /api/survey-quiz/:id', async () => {
        const res = await request(app).get('/api/survey-quiz/1');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveyQuizController.getSurveyQuizById).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('Sample Quiz');
    });

    // Test PUT /api/survey-quiz/:id
    it('should call updateSurveyQuiz when a valid PUT request is made to /api/survey-quiz/:id', async () => {
        const res = await request(app)
            .put('/api/survey-quiz/1')
            .send({ title: 'Updated Survey Quiz' });

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveyQuizController.updateSurveyQuiz).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Survey quiz updated successfully');
    });

    // Test DELETE /api/survey-quiz/:id
    it('should call deleteSurveyQuiz when a valid DELETE request is made to /api/survey-quiz/:id', async () => {
        const res = await request(app).delete('/api/survey-quiz/1');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveyQuizController.deleteSurveyQuiz).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Survey quiz deleted successfully');
    });

    // Test POST /api/survey-quiz/:id/publish
    it('should call publishSurveyQuiz when a valid POST request is made to /api/survey-quiz/:id/publish', async () => {
        const res = await request(app).post('/api/survey-quiz/1/publish');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveyQuizController.publishSurveyQuiz).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Survey quiz published successfully');
    });

    // Test POST /api/survey-quiz/:id/close
    it('should call closeSurveyQuiz when a valid POST request is made to /api/survey-quiz/:id/close', async () => {
        const res = await request(app).post('/api/survey-quiz/1/close');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveyQuizController.closeSurveyQuiz).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Survey quiz closed successfully');
    });
});
