const request = require('supertest');
const express = require('express');
const router = require('../../routes/surveyAnswerRoutes');

// Mock middlewares
jest.mock('../../middlewares/auth', () => ({
  auth: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
  optionalAuth: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/surveysubmitanswerController', () => ({
  submitSurveyAnswer: jest.fn((req, res) =>
    res.status(201).json({ message: 'Survey answer submitted successfully' })
  ),
  getAllAnswersForSession: jest.fn((req, res) =>
    res.status(200).json({ answers: [{ answerId: 1, response: 'Answer 1' }] })
  ),
  getAnswersForSpecificQuestion: jest.fn((req, res) =>
    res.status(200).json({
      questionId: req.params.questionId,
      answers: ['Answer 1', 'Answer 2'],
    })
  ),
}));

const { auth, isAdmin, optionalAuth } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json()); // Required for parsing JSON request bodies
app.use('/api', router);

describe('Survey Answer Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test POST /api/survey-submit-answer/:sessionId/:questionId
  it('should call submitSurveyAnswer with optionalAuth when a valid POST request is made to /api/survey-submit-answer/:sessionId/:questionId', async () => {
    const sessionId = 'session123';
    const questionId = 'question456';
    const res = await request(app)
      .post(`/api/survey-submit-answer/${sessionId}/${questionId}`)
      .send({ answer: 'Sample Answer' });

    expect(optionalAuth).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Survey answer submitted successfully');
  });

  // Test GET /api/survey-answers/:sessionId
  it('should call getAllAnswersForSession with auth and isAdmin when a valid GET request is made to /api/survey-answers/:sessionId', async () => {
    const sessionId = 'session123';
    const res = await request(app).get(`/api/survey-answers/${sessionId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.answers).toEqual([{ answerId: 1, response: 'Answer 1' }]);
  });

  // Test GET /api/survey-answers/:sessionId/:questionId
  it('should call getAnswersForSpecificQuestion with auth and isAdmin when a valid GET request is made to /api/survey-answers/:sessionId/:questionId', async () => {
    const sessionId = 'session123';
    const questionId = 'question456';
    const res = await request(app).get(
      `/api/survey-answers/${sessionId}/${questionId}`
    );

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      questionId: questionId,
      answers: ['Answer 1', 'Answer 2'],
    });
  });
});
