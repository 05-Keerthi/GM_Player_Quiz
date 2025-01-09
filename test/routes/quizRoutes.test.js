const request = require('supertest');
const express = require('express');
const router = require('../../routes/quizRoutes');
const quizController = require('../../controllers/quizController');

// Mock the middlewares
jest.mock('../../middlewares/auth', () => ({
  auth: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock the quizController functions
jest.mock('../../controllers/quizController', () => ({
  createQuiz: jest.fn((req, res) => res.status(201).json({ message: 'Quiz created successfully' })),
  getQuizzes: jest.fn((req, res) => res.status(200).json({ message: 'Quizzes retrieved successfully' })),
  getQuizById: jest.fn((req, res) => res.status(200).json({ message: 'Quiz retrieved successfully' })),
  updateQuiz: jest.fn((req, res) => res.status(200).json({ message: 'Quiz updated successfully' })),
  deleteQuiz: jest.fn((req, res) => res.status(200).json({ message: 'Quiz deleted successfully' })),
  publishQuiz: jest.fn((req, res) => res.status(200).json({ message: 'Quiz published successfully' })),
  closeQuiz: jest.fn((req, res) => res.status(200).json({ message: 'Quiz closed successfully' })),
}));

// Import the mocks after defining them
const { auth, isAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Quiz Routes', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mock call counts after each test
  });

  // Test POST /api/quizzes
  it('should call createQuiz when a valid POST request is made to /api/quizzes', async () => {
    const res = await request(app).post('/api/quizzes');

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(quizController.createQuiz).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Quiz created successfully');
  });

  // Test GET /api/quizzes
  it('should call getQuizzes when a valid GET request is made to /api/quizzes', async () => {
    const res = await request(app).get('/api/quizzes');

    expect(quizController.getQuizzes).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Quizzes retrieved successfully');
  });

  // Test GET /api/quizzes/:id
  it('should call getQuizById when a valid GET request is made to /api/quizzes/:id', async () => {
    const quizId = '123';
    const res = await request(app).get(`/api/quizzes/${quizId}`);

    expect(quizController.getQuizById).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Quiz retrieved successfully');
  });

  // Test PUT /api/quizzes/:id
  it('should call updateQuiz when a valid PUT request is made to /api/quizzes/:id', async () => {
    const quizId = '123';
    const res = await request(app).put(`/api/quizzes/${quizId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(quizController.updateQuiz).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Quiz updated successfully');
  });

  // Test DELETE /api/quizzes/:id
  it('should call deleteQuiz when a valid DELETE request is made to /api/quizzes/:id', async () => {
    const quizId = '123';
    const res = await request(app).delete(`/api/quizzes/${quizId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(quizController.deleteQuiz).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Quiz deleted successfully');
  });

  // Test POST /api/quizzes/:id/publish
  it('should call publishQuiz when a valid POST request is made to /api/quizzes/:id/publish', async () => {
    const quizId = '123';
    const res = await request(app).post(`/api/quizzes/${quizId}/publish`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(quizController.publishQuiz).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Quiz published successfully');
  });

  // Test POST /api/quizzes/:id/close
  it('should call closeQuiz when a valid POST request is made to /api/quizzes/:id/close', async () => {
    const quizId = '123';
    const res = await request(app).post(`/api/quizzes/${quizId}/close`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(quizController.closeQuiz).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Quiz closed successfully');
  });
});
