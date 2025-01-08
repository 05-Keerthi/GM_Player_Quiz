const request = require('supertest');
const express = require('express');
const router = require('../../routes/answerRoutes');
const {
  submitAnswer,
  getSessionAnswers,
  getAnswersForQuestionInSession,
} = require('../../controllers/answerController');

// Mock the controller functions
jest.mock('../../controllers/answerController', () => ({
  submitAnswer: jest.fn(),
  getSessionAnswers: jest.fn(),
  getAnswersForQuestionInSession: jest.fn(),
}));

// Mock the authentication middleware
jest.mock('../../middlewares/auth', () => {
  const authMock = jest.fn((req, res, next) => next());
  const isAdminMock = jest.fn((req, res, next) => next());

  return {
    auth: authMock,
    isAdmin: isAdminMock,
  };
});

// Create a test app with the router
const app = express();
app.use(express.json());
app.use('/api', router);

describe('AnswerRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/sessions/:sessionId/questions/:questionId/answer - should call submitAnswer', async () => {
    submitAnswer.mockImplementation((req, res) =>
      res.status(200).json({ message: 'Answer submitted successfully' })
    );

    const sessionId = '12345';
    const questionId = '67890';
    const answerData = { answer: 'Sample answer' };

    const response = await request(app)
      .post(`/api/sessions/${sessionId}/questions/${questionId}/answer`)
      .send(answerData);

    expect(submitAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { sessionId, questionId },
        body: answerData,
      }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Answer submitted successfully');
  });

  test('GET /api/sessions/:sessionId/answers - should call getSessionAnswers', async () => {
    getSessionAnswers.mockImplementation((req, res) =>
      res.status(200).json({ message: `Answers for session ${req.params.sessionId} fetched` })
    );

    const sessionId = '12345';

    const response = await request(app).get(`/api/sessions/${sessionId}/answers`);

    expect(getSessionAnswers).toHaveBeenCalledWith(
      expect.objectContaining({ params: { sessionId } }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(response.status).toBe(200);
    expect(response.body.message).toBe(`Answers for session ${sessionId} fetched`);
  });

  test('GET /api/sessions/:sessionId/questions/:questionId/answers - should call getAnswersForQuestionInSession', async () => {
    getAnswersForQuestionInSession.mockImplementation((req, res) =>
      res.status(200).json({
        message: `Answers for question ${req.params.questionId} in session ${req.params.sessionId} fetched`,
      })
    );

    const sessionId = '12345';
    const questionId = '67890';

    const response = await request(app).get(
      `/api/sessions/${sessionId}/questions/${questionId}/answers`
    );

    expect(getAnswersForQuestionInSession).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { sessionId, questionId },
      }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      `Answers for question ${questionId} in session ${sessionId} fetched`
    );
  });
});
