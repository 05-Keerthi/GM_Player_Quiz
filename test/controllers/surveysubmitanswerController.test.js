const mongoose = require('mongoose');
const SurveyAnswer = require('../../models/surveyanswer');
const SurveySession = require('../../models/surveysession');
const SurveyQuestion = require('../../models/surveyQuestion');
const Media = require('../../models/Media');

// Mock all dependencies
jest.mock('../../models/surveyanswer');
jest.mock('../../models/surveysession');
jest.mock('../../models/surveyQuestion');
jest.mock('../../models/Media');

const {
  submitSurveyAnswer,
  getAllAnswersForSession,
  getAnswersForSpecificQuestion
} = require('../../controllers/surveysubmitanswerController');

describe('Survey Submit Answer Controller', () => {
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
      user: {
        _id: 'user123',
        username: 'testuser'
      },
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

  describe('submitSurveyAnswer', () => {
    it('should submit new answer successfully', async () => {
      // Setup
      req.params = { sessionId: 'session123', questionId: 'question123' };
      req.body = { answer: 'Option A', timeTaken: 30 };

      const mockSession = { surveyStatus: 'in_progress' };
      const mockQuestion = { _id: 'question123' };
      const mockAnswer = {
        _id: 'answer123',
        surveyQuestion: 'question123',
        surveyAnswer: 'Option A',
        timeTaken: 30,
        save: jest.fn().mockResolvedValue(undefined)
      };

      SurveySession.findById.mockResolvedValue(mockSession);
      SurveyQuestion.findById.mockResolvedValue(mockQuestion);
      SurveyAnswer.findOne.mockResolvedValue(null);
      SurveyAnswer.mockImplementation(() => mockAnswer);

      // Execute
      await submitSurveyAnswer(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Answer submitted successfully',
        surveyAnswer: mockAnswer
      });
      expect(mockIo.emit).toHaveBeenCalledWith('survey-submit-answer', expect.any(Object));
    });

    it('should update existing answer successfully', async () => {
      // Setup
      req.params = { sessionId: 'session123', questionId: 'question123' };
      req.body = { answer: 'Option B', timeTaken: 45 };

      const mockSession = { surveyStatus: 'in_progress' };
      const mockQuestion = { _id: 'question123' };
      const mockExistingAnswer = {
        _id: 'answer123',
        surveyAnswer: 'Option A',
        timeTaken: 30,
        save: jest.fn().mockResolvedValue({ 
          _id: 'answer123',
          surveyAnswer: 'Option B',
          timeTaken: 45
        })
      };

      SurveySession.findById.mockResolvedValue(mockSession);
      SurveyQuestion.findById.mockResolvedValue(mockQuestion);
      SurveyAnswer.findOne.mockResolvedValue(mockExistingAnswer);

      // Execute
      await submitSurveyAnswer(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Answer updated successfully',
        surveyAnswer: expect.any(Object)
      });
    });

    it('should return error if session not found', async () => {
      // Setup
      req.params = { sessionId: 'nonexistent', questionId: 'question123' };
      SurveySession.findById.mockResolvedValue(null);

      // Execute
      await submitSurveyAnswer(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey session not found'
      });
    });

    it('should return error if session not in progress', async () => {
      // Setup
      const mockSession = { surveyStatus: 'completed' };
      SurveySession.findById.mockResolvedValue(mockSession);

      // Execute
      await submitSurveyAnswer(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey session is not in progress'
      });
    });
  });

  describe('getAllAnswersForSession', () => {
    it('should get all answers successfully', async () => {
      // Setup
      req.params = { sessionId: 'session123' };
      
      const mockSession = { _id: 'session123' };
      const mockAnswers = [
        {
          surveyQuestion: {
            _id: 'question123',
            imageUrl: { path: 'uploads\\image.jpg' },
            toObject: jest.fn().mockReturnThis()
          },
          surveyPlayers: {
            _id: 'user123',
            username: 'testuser',
            email: 'test@example.com'
          },
          surveyAnswer: 'Option A',
          timeTaken: 30,
          createdAt: new Date()
        }
      ];

      SurveySession.findById.mockResolvedValue(mockSession);
      SurveyAnswer.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockAnswers)
      });

      // Execute
      await getAllAnswersForSession(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Answers retrieved successfully',
        questions: expect.any(Array),
        userAnswers: expect.any(Array),
        groupedAnswers: expect.any(Object)
      });
    });

    it('should return error if session not found', async () => {
      // Setup
      req.params = { sessionId: 'nonexistent' };
      SurveySession.findById.mockResolvedValue(null);

      // Execute
      await getAllAnswersForSession(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey session not found'
      });
    });
  });

  describe('getAnswersForSpecificQuestion', () => {
    it('should get answers for specific question successfully', async () => {
      // Setup
      req.params = { sessionId: 'session123', questionId: 'question123' };
      
      const mockSession = { _id: 'session123' };
      const mockQuestion = {
        _id: 'question123',
        imageUrl: 'media123',
        answerOptions: [{ optionText: 'Option A' }],
        toObject: jest.fn().mockReturnThis()
      };
      const mockAnswers = [
        {
          surveyPlayers: {
            username: 'testuser',
            email: 'test@example.com'
          },
          surveyAnswer: 'Option A',
          timeTaken: 30
        }
      ];

      SurveySession.findById.mockResolvedValue(mockSession);
      SurveyQuestion.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuestion)
      });
      Media.findById.mockResolvedValue({ path: 'uploads\\image.jpg' });
      SurveyAnswer.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockAnswers)
      });

      // Execute
      await getAnswersForSpecificQuestion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Answers retrieved successfully for the specific question',
        question: expect.any(Object),
        groupedAnswers: expect.any(Object)
      });
    });

    it('should return error if question not found', async () => {
      // Setup
      req.params = { sessionId: 'session123', questionId: 'nonexistent' };
      
      const mockSession = { _id: 'session123' };
      SurveySession.findById.mockResolvedValue(mockSession);
      SurveyQuestion.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await getAnswersForSpecificQuestion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey question not found'
      });
    });
  });
});