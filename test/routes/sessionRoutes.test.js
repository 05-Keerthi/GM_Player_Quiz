const request = require('supertest');
const express = require('express');
const router = require('../../routes/sessionRoutes');

// Mock middlewares
jest.mock('../../middlewares/auth', () => ({
  auth: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/sessionController', () => ({
  createSession: jest.fn((req, res) => res.status(201).json({ message: 'Session created successfully' })),
  joinSession: jest.fn((req, res) => res.status(200).json({ message: 'Session joined successfully' })),
  startSession: jest.fn((req, res) => res.status(200).json({ message: 'Session started successfully' })),
  nextQuestion: jest.fn((req, res) => res.status(200).json({ message: 'Moved to the next question' })),
  endSession: jest.fn((req, res) => res.status(200).json({ message: 'Session ended successfully' })),
}));

const { auth, isAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use('/api', router);

describe('Session Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test POST /api/sessions/:quizId/publiz
  it('should call createSession when a valid POST request is made to /api/sessions/:quizId/publiz', async () => {
    const quizId = '123';
    const res = await request(app).post(`/api/sessions/${quizId}/publiz`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Session created successfully');
  });

  // Test POST /api/sessions/:joinCode/join
  it('should call joinSession when a valid POST request is made to /api/sessions/:joinCode/join', async () => {
    const joinCode = 'abc123';
    const res = await request(app).post(`/api/sessions/${joinCode}/join`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(0); // isAdmin is not required for this route
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Session joined successfully');
  });

  // Test POST /api/sessions/:joinCode/:sessionId/start
  it('should call startSession when a valid POST request is made to /api/sessions/:joinCode/:sessionId/start', async () => {
    const joinCode = 'abc123';
    const sessionId = '456';
    const res = await request(app).post(`/api/sessions/${joinCode}/${sessionId}/start`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Session started successfully');
  });

  // Test POST /api/sessions/:joinCode/:sessionId/next
  it('should call nextQuestion when a valid POST request is made to /api/sessions/:joinCode/:sessionId/next', async () => {
    const joinCode = 'abc123';
    const sessionId = '456';
    const res = await request(app).post(`/api/sessions/${joinCode}/${sessionId}/next`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Moved to the next question');
  });

  // Test POST /api/sessions/:joinCode/:sessionId/end
  it('should call endSession when a valid POST request is made to /api/sessions/:joinCode/:sessionId/end', async () => {
    const joinCode = 'abc123';
    const sessionId = '456';
    const res = await request(app).post(`/api/sessions/${joinCode}/${sessionId}/end`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Session ended successfully');
  });
});
