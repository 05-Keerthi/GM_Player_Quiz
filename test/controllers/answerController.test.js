const mongoose = require('mongoose');
const Answer = require('../../models/answer');
const Question = require('../../models/question');
const Session = require('../../models/session');
const Leaderboard = require('../../models/leaderBoard');
const User = require('../../models/User');

// Mock the dependencies
jest.mock('../../models/answer');
jest.mock('../../models/question');
jest.mock('../../models/session');
jest.mock('../../models/leaderBoard');
jest.mock('../../models/User');

const {
  submitAnswer,
  getSessionAnswers,
  getAnswersForQuestionInSession
} = require('../../controllers/answerController');

describe('Answer Controller', () => {
  let req;
  let res;
  let mockIo;

  beforeEach(() => {
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };

    req = {
      params: {},
      body: {},
      user: { id: 'user123' },
      app: {
        get: jest.fn().mockReturnValue(mockIo)
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe('submitAnswer', () => {
    it('should submit a multiple choice answer successfully', async () => {
      // Setup
      req.params = { sessionId: 'session123', questionId: 'question123' };
      req.body = {
        answer: 'Option A',
        timeTaken: 10
      };

      const mockSession = {
        _id: 'session123',
        status: 'in_progress'
      };

      const mockQuestion = {
        _id: 'question123',
        type: 'multiple_choice',
        timer: 30,
        points: 100,
        options: [
          { text: 'Option A', isCorrect: true },
          { text: 'Option B', isCorrect: false }
        ]
      };

      const mockNewAnswer = {
        _id: 'answer123',
        question: 'question123',
        user: 'user123',
        answer: 'Option A',
        isCorrect: true
      };

      Session.findOne.mockResolvedValue(mockSession);
      Question.findById.mockResolvedValue(mockQuestion);
      Answer.findOne.mockResolvedValue(null);
      Answer.create.mockResolvedValue(mockNewAnswer);
      Answer.find.mockResolvedValue([mockNewAnswer]);
      Answer.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockNewAnswer,
          user: { username: 'testuser', email: 'test@test.com' }
        })
      });

      Leaderboard.findOne.mockResolvedValue({
        score: 0,
        save: jest.fn().mockResolvedValue(undefined)
      });

      Leaderboard.find.mockResolvedValue([
        { score: 100, save: jest.fn().mockResolvedValue(undefined) }
      ]);

      // Execute
      await submitAnswer(req, res);
    });

    it('should handle multiple select answers correctly', async () => {
      // Setup
      req.params = { sessionId: 'session123', questionId: 'question123' };
      req.body = {
        answer: ['Option A', 'Option B'],
        timeTaken: 10
      };

      const mockQuestion = {
        _id: 'question123',
        type: 'multiple_select',
        timer: 30,
        points: 100,
        options: [
          { text: 'Option A', isCorrect: true },
          { text: 'Option B', isCorrect: true },
          { text: 'Option C', isCorrect: false }
        ]
      };

      Session.findOne.mockResolvedValue({ status: 'in_progress' });
      Question.findById.mockResolvedValue(mockQuestion);
      Answer.findOne.mockResolvedValue(null);

      // Execute
      await submitAnswer(req, res);

    });

    it('should reject duplicate answers', async () => {
      // Setup
      req.params = { sessionId: 'session123', questionId: 'question123' };
      req.body = {
        answer: 'Option A',
        timeTaken: 10
      };

      Session.findOne.mockResolvedValue({ status: 'in_progress' });
      Question.findById.mockResolvedValue({});
      Answer.findOne.mockResolvedValue({ _id: 'existing_answer' });

      // Execute
      await submitAnswer(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'You have already answered this question'
      }));
    });
  });

  describe('getSessionAnswers', () => {
    it('should get all answers for a session successfully', async () => {
      // Setup
      req.params = { sessionId: 'session123' };

      const mockAnswers = [
        {
          _id: 'answer1',
          question: {
            _id: 'question123',
            questionText: 'Test Question',
            type: 'multiple_choice',
            points: 100
          },
          user: {
            username: 'user1',
            email: 'user1@test.com',
            mobile: '1234567890'
          },
          answer: 'Option A',
          isCorrect: true
        }
      ];

      Session.findOne.mockResolvedValue({ status: 'in_progress' });
      Answer.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAnswers)
      });
      Question.findById.mockResolvedValue({
        questionText: 'Test Question',
        type: 'multiple_choice',
        points: 100
      });

      // Execute
      await getSessionAnswers(req, res);
    });

    it('should handle invalid session ID format', async () => {
      // Setup
      req.params = { sessionId: 'invalid-id' };

      // Execute
      await getSessionAnswers(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid session ID format'
      }));
    });
  });

  describe('getAnswersForQuestionInSession', () => {
    it('should get answers for a specific question in a session', async () => {
      // Setup
      req.params = { 
        sessionId: 'session123',
        questionId: 'question123'
      };

      const mockQuestion = {
        _id: 'question123',
        questionText: 'Test Question',
        points: 100
      };

      const mockAnswers = [
        {
          user: {
            username: 'user1',
            email: 'user1@test.com',
            mobile: '1234567890'
          },
          answer: 'Option A',
          isCorrect: true,
          timeTaken: 10
        }
      ];

      Session.findOne.mockResolvedValue({ status: 'in_progress' });
      Question.findById.mockResolvedValue(mockQuestion);
      Answer.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockAnswers)
      });

      // Execute
      await getAnswersForQuestionInSession(req, res);

    });

    it('should handle invalid question ID format', async () => {
      // Setup
      req.params = {
        sessionId: 'session123',
        questionId: 'invalid-id'
      };

      // Execute
      await getAnswersForQuestionInSession(req, res);

    });
  });
});