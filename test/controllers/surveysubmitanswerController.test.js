const mongoose = require('mongoose');
const SurveyAnswer = require('../../models/surveyanswer');
const SurveySession = require('../../models/surveysession');
const SurveyQuestion = require('../../models/surveyQuestion');
const Media = require('../../models/Media');

// Mock the dependencies
jest.mock('../../models/surveyanswer');
jest.mock('../../models/surveysession');
jest.mock('../../models/surveyQuestion');
jest.mock('../../models/Media');

const {
  submitSurveyAnswer,
  getAllAnswersForSession,
  getAnswersForSpecificQuestion
} = require('../../controllers/surveysubmitanswerController');

describe('Survey Answer Controller', () => {
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
      app: {
        get: jest.fn().mockReturnValue(mockIo)
      },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000')
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
    it('should submit a survey answer successfully', async () => {
      // Setup
      req.params = { sessionId: 'session123', questionId: 'question123' };
      req.body = {
        answer: 'Option A',
        timeTaken: 10
      };

      const mockSession = {
        _id: 'session123',
        surveyStatus: 'in_progress'
      };

      const mockQuestion = {
        _id: 'question123'
      };

      const mockNewAnswer = {
        _id: 'answer123',
        surveyQuestion: 'question123',
        surveyPlayers: 'user123',
        surveyAnswer: 'Option A',
        timeTaken: 10
      };

      SurveySession.findById.mockResolvedValue(mockSession);
      SurveyQuestion.findById.mockResolvedValue(mockQuestion);
      SurveyAnswer.findOne.mockResolvedValue(null);
      SurveyAnswer.prototype.save = jest.fn().mockResolvedValue(mockNewAnswer);

      // Execute
      await submitSurveyAnswer(req, res);

      expect(mockIo.emit).toHaveBeenCalledWith('survey-submit-answer', {
        sessionId: 'session123',
        questionId: 'question123',
        userId: 'user123',
        answer: 'Option A',
        timeTaken: 10
      });
    });

    it('should handle non-existent session', async () => {
      req.params = { sessionId: 'nonexistent', questionId: 'question123' };
      SurveySession.findById.mockResolvedValue(null);

      await submitSurveyAnswer(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey session not found'
      });
    });

    it('should handle non-existent question', async () => {
      req.params = { sessionId: 'session123', questionId: 'nonexistent' };
      SurveySession.findById.mockResolvedValue({ surveyStatus: 'in_progress' });
      SurveyQuestion.findById.mockResolvedValue(null);

      await submitSurveyAnswer(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey question not found'
      });
    });

    it('should handle duplicate answers', async () => {
      req.params = { sessionId: 'session123', questionId: 'question123' };
      SurveySession.findById.mockResolvedValue({ surveyStatus: 'in_progress' });
      SurveyQuestion.findById.mockResolvedValue({});
      SurveyAnswer.findOne.mockResolvedValue({ _id: 'existing_answer' });

      await submitSurveyAnswer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'You have already submitted an answer for this question'
      });
    });
  });

  describe('getAllAnswersForSession', () => {
    it('should get all answers for a session successfully', async () => {
      req.params = { sessionId: 'session123' };

      const mockSession = { _id: 'session123' };
      const mockAnswers = [{
        surveyQuestion: {
          _id: 'question123',
          imageUrl: {
            path: 'uploads\\image.jpg'
          },
          toObject: () => ({
            _id: 'question123',
            imageUrl: {
              path: 'uploads\\image.jpg'
            }
          })
        },
        surveyPlayers: {
          _id: 'user123',
          username: 'testuser',
          email: 'test@example.com'
        },
        surveyAnswer: 'Option A',
        timeTaken: 10
      }];

      SurveySession.findById.mockResolvedValue(mockSession);
      SurveyAnswer.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockAnswers)
      });

      await getAllAnswersForSession(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Answers retrieved successfully'
      }));
    });

    it('should handle session not found', async () => {
      req.params = { sessionId: 'nonexistent' };
      SurveySession.findById.mockResolvedValue(null);

      await getAllAnswersForSession(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey session not found'
      });
    });
  });

  describe('getAnswersForSpecificQuestion', () => {
    it('should get answers for a specific question successfully', async () => {
      req.params = { sessionId: 'session123', questionId: 'question123' };

      const mockSession = { _id: 'session123' };
      const mockQuestion = {
        _id: 'question123',
        imageUrl: 'media123',
        answerOptions: [{ optionText: 'Option A' }],
        toObject: () => ({
          _id: 'question123',
          imageUrl: 'media123',
          answerOptions: [{ optionText: 'Option A' }]
        })
      };
      const mockAnswers = [{
        surveyAnswer: 'Option A',
        surveyPlayers: {
          username: 'testuser',
          email: 'test@example.com'
        },
        timeTaken: 10
      }];

      SurveySession.findById.mockResolvedValue(mockSession);
      SurveyQuestion.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuestion)
      });
      Media.findById.mockResolvedValue({ path: 'uploads\\image.jpg' });
      SurveyAnswer.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockAnswers)
      });

      await getAnswersForSpecificQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Answers retrieved successfully for the specific question'
      }));
    });

    it('should handle question not found', async () => {
      req.params = { sessionId: 'session123', questionId: 'nonexistent' };
      SurveySession.findById.mockResolvedValue({ _id: 'session123' });
      SurveyQuestion.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getAnswersForSpecificQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey question not found'
      });
    });
  });
});