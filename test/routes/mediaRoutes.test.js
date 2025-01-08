const request = require('supertest');
const express = require('express');
const router = require('../../routes/mediaRoutes');
const mediaController = require('../../controllers/mediaController');

// Mock the middlewares
jest.mock('../../middlewares/auth', () => ({
    auth: jest.fn((req, res, next) => next()),
    isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock the mediaController functions
jest.mock('../../controllers/mediaController', () => ({
    uploadMedia: jest.fn((req, res) => res.status(201).json({ message: 'Media uploaded successfully' })),
    deleteAllMedia: jest.fn((req, res) => res.status(200).json({ message: 'All media deleted successfully' })),
    getMediaDetails: jest.fn((req, res) => res.status(200).json({ message: 'Media details retrieved successfully' })),
    deleteMedia: jest.fn((req, res) => res.status(200).json({ message: 'Media deleted successfully' })),
    getAllMedia: jest.fn((req, res) => res.status(200).json({ message: 'All media retrieved successfully' })),
}));

// Import the mocks after defining them
const { auth, isAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Media Routes', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear mock call counts after each test
    });

    // Test POST /api/media/upload
    it('should call uploadMedia when a valid POST request is made to /api/media/upload', async () => {
        const res = await request(app).post('/api/media/upload');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(mediaController.uploadMedia).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Media uploaded successfully');
    });

    // Test DELETE /api/media/all
    it('should call deleteAllMedia when a valid DELETE request is made to /api/media/all', async () => {
        const res = await request(app).delete('/api/media/all');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(mediaController.deleteAllMedia).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('All media deleted successfully');
    });

    // Test GET /api/media/:id
    it('should call getMediaDetails when a valid GET request is made to /api/media/:id', async () => {
        const res = await request(app).get('/api/media/1');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(mediaController.getMediaDetails).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Media details retrieved successfully');
    });

    // Test DELETE /api/media/:id
    it('should call deleteMedia when a valid DELETE request is made to /api/media/:id', async () => {
        const res = await request(app).delete('/api/media/1');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(mediaController.deleteMedia).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Media deleted successfully');
    });

    // Test GET /api/media
    it('should call getAllMedia when a valid GET request is made to /api/media', async () => {
        const res = await request(app).get('/api/media');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdmin).toHaveBeenCalledTimes(1);
        expect(mediaController.getAllMedia).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('All media retrieved successfully');
    });
});
