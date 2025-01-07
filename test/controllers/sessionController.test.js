const mongoose = require('mongoose');
const Session = require('../../models/session');
const Quiz = require('../../models/quiz');
const Question = require('../../models/question');
const Slide = require('../../models/slide');
const User = require('../../models/User');
const Report = require('../../models/Report');
const Answer = require('../../models/answer');
const Leaderboard = require('../../models/leaderBoard');
const ActivityLog = require('../../models/ActivityLog');
const QRCode = require('qrcode');

// Mock the dependencies
jest.mock('../../models/session');
jest.mock('../../models/quiz');
jest.mock('../../models/question');
jest.mock('../../models/slide');
jest.mock('../../models/User');
jest.mock('../../models/Report');
jest.mock('../../models/answer');
jest.mock('../../models/leaderBoard');
jest.mock('../../models/ActivityLog');
jest.mock('qrcode');

const {
  createSession,
  joinSession,
  startSession,
  nextQuestion,
  endSession
} = require('../../controllers/sessionController');

describe('Session Controller', () => {
  let req;
  let res;
  let mockIo;

  beforeEach(() => {
    mockIo = {
      emit: jest.fn()
    };

    req = {
      params: {},
      body: {},
      user: { _id: 'user123' },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:5000'),
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

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      // Setup
      req.params = { quizId: 'quiz123' };
      
      const mockSavedSession = {
        _id: 'session123',
        quiz: 'quiz123',
        host: 'user123',
        joinCode: '123456',
        status: 'waiting',
        players: [],
        qrData: 'mock-qr-data',
        save: jest.fn().mockResolvedValueOnce()
      };

      const mockPopulatedSession = {
        ...mockSavedSession,
        toObject: jest.fn().mockReturnValue(mockSavedSession)
      };

      Session.mockImplementation(() => mockSavedSession);
      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockPopulatedSession)
      });

      QRCode.toDataURL.mockResolvedValue('mock-qr-code-url');

      // Execute
      await createSession(req, res);

    });
  });

  describe('joinSession', () => {
    it('should allow a user to join a session', async () => {
      // Setup
      req.params = { joinCode: '123456' };
      
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@test.com'
      };

      const mockSession = {
        _id: 'session123',
        status: 'waiting',
        players: [],
        save: jest.fn().mockResolvedValue(undefined)
      };

      const mockPopulatedSession = {
        ...mockSession,
        players: [mockUser]
      };

      Session.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockSession)
      });

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      Session.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockPopulatedSession)
      });

      // Execute
      await joinSession(req, res);

    });

    it('should return error if session not found', async () => {
      // Setup
      req.params = { joinCode: 'invalid' };
      Session.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await joinSession(req, res);

    });
  });

  describe('startSession', () => {
    it('should start a session successfully', async () => {
      // Setup
      req.params = { joinCode: '123456', sessionId: 'session123' };
      
      const mockQuestions = [{
        _id: 'question123',
        toObject: jest.fn().mockReturnThis()
      }];

      const mockSlides = [{
        _id: 'slide123',
        toObject: jest.fn().mockReturnThis()
      }];

      const mockSession = {
        _id: 'session123',
        status: 'waiting',
        quiz: { questions: ['question123'], slides: ['slide123'] },
        save: jest.fn().mockResolvedValue(undefined)
      };

      Session.findOne.mockResolvedValue(mockSession);
      Question.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuestions)
      });
      Slide.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSlides)
      });

      // Execute
      await startSession(req, res);

    });
  });

  describe('nextQuestion', () => {
    it('should move to the next question successfully', async () => {
      // Setup
      req.params = { joinCode: '123456', sessionId: 'session123' };
      
      const mockQuiz = {
        _id: 'quiz123',
        order: [{ id: 'question123', type: 'question' }],
        questions: [{
          _id: 'question123',
          title: 'Test Question',
          toObject: jest.fn().mockReturnValue({
            _id: 'question123',
            title: 'Test Question'
          })
        }],
        slides: []
      };

      const mockSession = {
        _id: 'session123',
        status: 'in_progress',
        quiz: mockQuiz,
        save: jest.fn().mockResolvedValue(undefined)
      };

      Session.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockSession)
      });

      Quiz.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockQuiz)
      });

      // Execute
      await nextQuestion(req, res);

    });
  });

  describe('endSession', () => {
    it('should end a session successfully', async () => {
      // Setup
      req.params = { joinCode: '123456', sessionId: 'session123' };
      
      const mockSession = {
        _id: 'session123',
        status: 'in_progress',
        players: [{ _id: 'user123', username: 'testuser' }],
        quiz: { 
          _id: 'quiz123',
          title: 'Test Quiz', 
          description: 'Test Description' 
        },
        save: jest.fn().mockResolvedValue(undefined),
        endTime: Date.now()
      };

      Session.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockSession)
      });

      Leaderboard.find.mockResolvedValue([{
        player: 'user123',
        score: 100,
        session: 'session123'
      }]);

      Answer.countDocuments
        .mockResolvedValueOnce(10)  // total questions
        .mockResolvedValueOnce(8);  // correct answers

      Report.create.mockResolvedValue({
        _id: 'report123',
        quiz: 'quiz123',
        user: 'user123'
      });

      ActivityLog.create.mockResolvedValue({
        _id: 'log123',
        user: 'user123'
      });

      // Execute
      await endSession(req, res);

    });

    it('should return error if session not found', async () => {
      // Setup
      req.params = { joinCode: '123456', sessionId: 'nonexistent' };
      Session.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await endSession(req, res);

    });
  });
});