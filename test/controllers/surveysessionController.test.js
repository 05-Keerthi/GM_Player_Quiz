const mongoose = require('mongoose');
const SurveySession = require('../../models/surveysession');
const SurveyQuiz = require('../../models/surveyQuiz');
const SurveyQuestion = require('../../models/surveyQuestion');
const SurveySlide = require('../../models/surveySlide');
const User = require('../../models/User');
const Media = require('../../models/Media');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { mockRequest, mockResponse } = require('jest-mock-req-res');

// Mock the dependencies
jest.mock('../../models/surveysession');
jest.mock('../../models/surveyQuiz');
jest.mock('../../models/surveyQuestion');
jest.mock('../../models/surveySlide');
jest.mock('../../models/User');
jest.mock('../../models/Media');
jest.mock('qrcode');
jest.mock('crypto');

const {
  createSurveySession,
  joinSurveySession,
  startSurveySession,
  nextSurveyQuestion,
  endSurveySession
} = require('../../controllers/surveySessionController');

describe('Survey Session Controller', () => {
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

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('createSurveySession', () => {
    it('should create a survey session successfully', async () => {
      // Setup
      req.params = { surveyQuizId: 'quiz123' };
      
      crypto.randomInt.mockReturnValue(123456);

      const mockSavedSession = {
        _id: 'session123',
        surveyQuiz: 'quiz123',
        surveyHost: 'user123',
        surveyJoinCode: '123456',
        surveyStatus: 'waiting',
        surveyPlayers: [],
        surveyQrData: 'mock-qr-data',
        save: jest.fn().mockResolvedValueOnce()
      };

      const mockPopulatedSession = {
        ...mockSavedSession,
        toObject: jest.fn().mockReturnValue(mockSavedSession)
      };

      SurveySession.mockImplementation(() => mockSavedSession);
      SurveySession.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockPopulatedSession)
      });

      QRCode.toDataURL.mockResolvedValue('mock-qr-code-url');

      // Execute
      await createSurveySession(req, res);

    });
  });

  describe('joinSurveySession', () => {
    let req, res;
  
    beforeEach(() => {
      req = mockRequest();
      res = mockResponse();
      jest.clearAllMocks();
    });
  
    it('should allow a guest user to join a survey session', async () => {
      req.params = { joinCode: '123456' };
      req.body = { isGuest: true, username: 'guestuser', email: 'guest@test.com', mobile: '1234567890' };
  
      const mockSession = {
        _id: 'session123',
        surveyStatus: 'waiting',
        surveyPlayers: [],
        save: jest.fn().mockResolvedValue(undefined),
        populate: jest.fn().mockReturnThis(),
      };
  
      SurveySession.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockSession),
      });
  
      const mockUser = {
        _id: 'user123',
        username: 'guestuser',
        email: 'guest@test.com',
        mobile: '1234567890',
        isGuest: true,
        save: jest.fn().mockResolvedValue(undefined),
      };
  
      User.findOne.mockResolvedValue(null);
      User.mockImplementation(() => mockUser);
  
      await joinSurveySession(req, res);
  
      expect(SurveySession.findOne).toHaveBeenCalledWith({ surveyJoinCode: '123456' });
     
    });
  
    it('should return error if survey session is not found', async () => {
      req.params = { joinCode: 'invalid' };
  
      SurveySession.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null),
      });
  
      await joinSurveySession(req, res);
  
      
    });
  
    it('should return error if session is not open for joining', async () => {
      req.params = { joinCode: '123456' };
  
      const mockSession = {
        _id: 'session123',
        surveyStatus: 'closed',
        surveyPlayers: [],
        populate: jest.fn().mockReturnThis(),
      };
  
      SurveySession.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockSession),
      });
  
      await joinSurveySession(req, res);
  
     
    });
  
    it('should return error if required guest user fields are missing', async () => {
      req.params = { joinCode: '123456' };
      req.body = { isGuest: true, username: 'guestuser' };
  
      const mockSession = {
        _id: 'session123',
        surveyStatus: 'waiting',
        surveyPlayers: [],
        populate: jest.fn().mockReturnThis(),
      };
  
      SurveySession.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockSession),
      });
  
      await joinSurveySession(req, res);
  
     
    });
  
    it('should return error if user is already in the session', async () => {
      req.params = { joinCode: '123456' };
      req.body = { isGuest: false };
      req.user = { _id: 'user123' };
  
      const mockSession = {
        _id: 'session123',
        surveyStatus: 'waiting',
        surveyPlayers: [{ _id: 'user123' }],
        populate: jest.fn().mockReturnThis(),
      };
  
      SurveySession.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockSession),
      });
  
      User.findById.mockResolvedValue({ _id: 'user123' });
  
      await joinSurveySession(req, res);
  

    });
  
    it('should handle unexpected errors gracefully', async () => {
      req.params = { joinCode: '123456' };
      req.body = { isGuest: false };
      req.user = { _id: 'user123' };
  
      SurveySession.findOne.mockImplementation(() => {
        throw new Error('Unexpected error');
      });
  
      await joinSurveySession(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error joining session',
        error: 'Unexpected error',
      });
    });
  });

  describe('startSurveySession', () => {
    it('should start a survey session successfully', async () => {
      // Setup
      req.params = { joinCode: '123456', sessionId: 'session123' };
      process.env.HOST = 'http://localhost:5000/';
      
      const mockQuestions = [{
        _id: 'question123',
        toObject: jest.fn().mockReturnThis(),
        imageUrl: { path: 'path/to/image.jpg' }
      }];

      const mockSlides = [{
        _id: 'slide123',
        toObject: jest.fn().mockReturnThis(),
        imageUrl: { path: 'path/to/slide.jpg' }
      }];

      const mockSession = {
        _id: 'session123',
        surveyStatus: 'waiting',
        surveyQuiz: { questions: ['question123'], slides: ['slide123'] },
        save: jest.fn().mockResolvedValue(undefined)
      };

      SurveySession.findOne.mockResolvedValue(mockSession);
      SurveyQuestion.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuestions)
      });
      SurveySlide.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSlides)
      });

      // Execute
      await startSurveySession(req, res);

    });
  });

  describe('nextSurveyQuestion', () => {
    it('should move to the next question successfully', async () => {
      // Setup
      req.params = { joinCode: '123456', sessionId: 'session123' };
      
      const mockQuiz = {
        _id: 'quiz123',
        order: [{ id: 'question123', type: 'question' }],
        questions: [{
          _id: 'question123',
          title: 'Test Question',
          imageUrl: { path: 'path/to/image.jpg' },
          toObject: jest.fn().mockReturnValue({
            _id: 'question123',
            title: 'Test Question',
            imageUrl: { path: 'path/to/image.jpg' }
          })
        }],
        slides: []
      };

      const mockSession = {
        _id: 'session123',
        surveyStatus: 'in_progress',
        surveyQuiz: mockQuiz,
        save: jest.fn().mockResolvedValue(undefined)
      };

      SurveySession.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockSession)
      });

      SurveyQuiz.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockQuiz)
      });

      // Execute
      await nextSurveyQuestion(req, res);
    });
  });

  describe('endSurveySession', () => {
    it('should end a survey session successfully', async () => {
      // Setup
      req.params = { joinCode: '123456', sessionId: 'session123' };
      
      const mockSession = {
        _id: 'session123',
        surveyStatus: 'in_progress',
        surveyPlayers: [{ _id: 'user123', username: 'testuser' }],
        surveyQuiz: { 
          _id: 'quiz123',
          title: 'Test Quiz', 
          description: 'Test Description' 
        },
        save: jest.fn().mockResolvedValue(undefined)
      };

      SurveySession.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockSession)
      });

      // Execute
      await endSurveySession(req, res);

    });

    it('should return error if survey session not found', async () => {
      // Setup
      req.params = { joinCode: '123456', sessionId: 'nonexistent' };
      SurveySession.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await endSurveySession(req, res);

    });
  });
});