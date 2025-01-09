const request = require('supertest');
const express = require('express');
const router = require('../../routes/questionRoutes');
const questionController = require('../../controllers/questionController');

// Mock the middlewares
jest.mock('../../middlewares/auth', () => ({
  auth: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock the questionController functions
jest.mock('../../controllers/questionController', () => ({
  addQuestion: jest.fn((req, res) => res.status(201).json({ message: 'Question added successfully' })),
  getQuestions: jest.fn((req, res) => res.status(200).json({ message: 'Questions retrieved successfully' })),
  getQuestionById: jest.fn((req, res) => res.status(200).json({ message: 'Question retrieved successfully' })),
  updateQuestion: jest.fn((req, res) => res.status(200).json({ message: 'Question updated successfully' })),
  deleteQuestion: jest.fn((req, res) => res.status(200).json({ message: 'Question deleted successfully' })),
}));

// Import the mocks after defining them
const { auth, isAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Question Routes', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear mock call counts after each test
  });

  // Test POST /api/quizzes/:quizId/questions
  it('should call addQuestion when a valid POST request is made to /api/quizzes/:quizId/questions', async () => {
    const quizId = '123';
    const res = await request(app).post(`/api/quizzes/${quizId}/questions`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(questionController.addQuestion).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Question added successfully');
  });

  // Test GET /api/quizzes/:quizId/questions
  it('should call getQuestions when a valid GET request is made to /api/quizzes/:quizId/questions', async () => {
    const quizId = '123';
    const res = await request(app).get(`/api/quizzes/${quizId}/questions`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(questionController.getQuestions).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Questions retrieved successfully');
  });

  // Test GET /api/questions/:id
  it('should call getQuestionById when a valid GET request is made to /api/questions/:id', async () => {
    const questionId = '456';
    const res = await request(app).get(`/api/questions/${questionId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(questionController.getQuestionById).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Question retrieved successfully');
  });

  // Test PUT /api/questions/:id
  it('should call updateQuestion when a valid PUT request is made to /api/questions/:id', async () => {
    const questionId = '456';
    const res = await request(app).put(`/api/questions/${questionId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(questionController.updateQuestion).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Question updated successfully');
  });

  // Test DELETE /api/questions/:id
  it('should call deleteQuestion when a valid DELETE request is made to /api/questions/:id', async () => {
    const questionId = '456';
    const res = await request(app).delete(`/api/questions/${questionId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(questionController.deleteQuestion).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Question deleted successfully');
  });
});
