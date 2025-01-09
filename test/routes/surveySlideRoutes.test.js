const request = require('supertest');
const express = require('express');
const router = require('../../routes/surveySlideRoutes');
const surveySlideController = require('../../controllers/surveySlideController');

// Mock middlewares
jest.mock('../../middlewares/auth', () => ({
    auth: jest.fn((req, res, next) => next()),
    isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/surveySlideController', () => ({
    addSurveySlide: jest.fn((req, res) => res.status(201).json({ message: 'Survey slide added successfully' })),
    getSurveySlides: jest.fn((req, res) => res.status(200).json({ message: 'Survey slides retrieved successfully' })),
    getSurveySlide: jest.fn((req, res) => res.status(200).json({ message: 'Survey slide retrieved successfully' })),
    updateSurveySlide: jest.fn((req, res) => res.status(200).json({ message: 'Survey slide updated successfully' })),
    deleteSurveySlide: jest.fn((req, res) => res.status(200).json({ message: 'Survey slide deleted successfully' })),
}));

// Import the mocks after defining them
const { auth, isAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Survey Slide Routes', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear mock call counts after each test
    });

    // Test POST /api/surveys/:surveyQuizId/slides
    it('should call addSurveySlide when a valid POST request is made to /api/surveys/:surveyQuizId/slides', async () => {
        const res = await request(app)
            .post('/api/surveys/1/slides')
            .send({ title: 'New Slide', description: 'Slide description' });

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveySlideController.addSurveySlide).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Survey slide added successfully');
    });

    // Test GET /api/surveys/:surveyQuizId/slides
    it('should call getSurveySlides when a valid GET request is made to /api/surveys/:surveyQuizId/slides', async () => {
        const res = await request(app).get('/api/surveys/1/slides');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(surveySlideController.getSurveySlides).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Survey slides retrieved successfully');
    });

    // Test GET /api/surveys/slides/:id
    it('should call getSurveySlide when a valid GET request is made to /api/surveys/slides/:id', async () => {
        const res = await request(app).get('/api/surveys/slides/1');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(surveySlideController.getSurveySlide).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Survey slide retrieved successfully');
    });

    // Test PUT /api/surveys/slides/:id
    it('should call updateSurveySlide when a valid PUT request is made to /api/surveys/slides/:id', async () => {
        const res = await request(app)
            .put('/api/surveys/slides/1')
            .send({ title: 'Updated Slide', description: 'Updated description' });

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveySlideController.updateSurveySlide).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Survey slide updated successfully');
    });

    // Test DELETE /api/surveys/slides/:id
    it('should call deleteSurveySlide when a valid DELETE request is made to /api/surveys/slides/:id', async () => {
        const res = await request(app).delete('/api/surveys/slides/1');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(surveySlideController.deleteSurveySlide).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Survey slide deleted successfully');
    });
});
