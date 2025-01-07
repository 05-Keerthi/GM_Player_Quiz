const mongoose = require('mongoose');
const SurveyQuestion = require('../../models/surveyQuestion');
const SurveyQuiz = require('../../models/surveyQuiz');
const Media = require('../../models/Media');

// Mock the dependencies
jest.mock('../../models/surveyQuestion');
jest.mock('../../models/surveyQuiz');
jest.mock('../../models/Media');

const {
  createSurveyQuestion,
  getSurveyQuestions,
  getSurveyQuestionById,
  updateSurveyQuestionById,
  deleteSurveyQuestionById
} = require('../../controllers/surveyQuestionController');

describe('Survey Question Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:5000')
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('createSurveyQuestion', () => {
    const mockQuestionData = {
      title: 'Test Survey Question',
      description: 'Test Description',
      dimension: 'Test Dimension',
      year: 2024,
      imageUrl: 'media123',
      timer: 30,
      answerOptions: [
        { optionText: 'Option 1', color: '#ff0000' },
        { optionText: 'Option 2', color: '#00ff00' }
      ]
    };

    it('should create a survey question successfully', async () => {
      // Setup
      req.params = { surveyquizId: 'quiz123' };
      req.body = mockQuestionData;

      const mockSurveyQuiz = {
        _id: 'quiz123',
        questions: [],
        save: jest.fn().mockResolvedValue(undefined)
      };

      const mockImage = {
        _id: 'media123',
        path: 'uploads\\test-image.jpg'
      };

      const mockNewQuestion = {
        _id: 'question123',
        ...mockQuestionData,
        surveyQuiz: 'quiz123',
        save: jest.fn().mockResolvedValue({
          _id: 'question123',
          ...mockQuestionData,
          surveyQuiz: 'quiz123',
          toObject: () => ({
            _id: 'question123',
            ...mockQuestionData,
            surveyQuiz: 'quiz123'
          })
        }),
        toObject: () => ({
          _id: 'question123',
          ...mockQuestionData,
          surveyQuiz: 'quiz123'
        })
      };

      // Update mocks
      SurveyQuiz.findById = jest.fn().mockResolvedValue(mockSurveyQuiz);
      Media.findById = jest.fn().mockResolvedValue(mockImage);
      SurveyQuestion.prototype.save = jest.fn().mockResolvedValue(mockNewQuestion);
      
      // Mock the constructor
      const mockConstructor = jest.fn().mockImplementation(() => mockNewQuestion);
      SurveyQuestion.mockImplementation(mockConstructor);

      // Execute
      await createSurveyQuestion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Survey question created successfully',
        data: expect.objectContaining({
          _id: 'question123',
          title: mockQuestionData.title,
          description: mockQuestionData.description,
          imageUrl: expect.stringContaining('/uploads/test-image.jpg')
        })
      });
      expect(mockSurveyQuiz.save).toHaveBeenCalled();
      expect(mockNewQuestion.save).toHaveBeenCalled();
    });

    it('should return error if survey quiz not found', async () => {
      // Setup
      req.params = { surveyquizId: 'nonexistent' };
      req.body = mockQuestionData;
      SurveyQuiz.findById.mockResolvedValue(null);

      // Execute
      await createSurveyQuestion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey quiz not found'
      });
    });

    it('should return error if required fields are missing', async () => {
      // Setup
      req.params = { surveyquizId: 'quiz123' };
      req.body = { title: 'Test' }; // Missing required fields

      // Execute
      await createSurveyQuestion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'All fields are required, including at least one answer option.'
      });
    });
  });

  describe('getSurveyQuestions', () => {
    it('should get all questions for a survey quiz successfully', async () => {
      // Setup
      req.params = { surveyquizId: 'quiz123' };
      const mockQuestions = [
        {
          _id: 'question1',
          title: 'Question 1',
          imageUrl: 'media1',
          toObject: jest.fn().mockReturnThis()
        },
        {
          _id: 'question2',
          title: 'Question 2',
          imageUrl: 'media2',
          toObject: jest.fn().mockReturnThis()
        }
      ];

      SurveyQuiz.findById.mockResolvedValue({ _id: 'quiz123' });
      SurveyQuestion.find.mockResolvedValue(mockQuestions);
      Media.findById.mockImplementation((id) => ({
        path: `uploads\\${id}-image.jpg`
      }));

      // Execute
      await getSurveyQuestions(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Survey questions retrieved successfully',
        data: expect.arrayContaining([
          expect.objectContaining({
            _id: 'question1',
            imageUrl: expect.stringContaining('/uploads/')
          })
        ])
      });
    });

    it('should return error if no questions found', async () => {
      // Setup
      req.params = { surveyquizId: 'quiz123' };
      SurveyQuiz.findById.mockResolvedValue({ _id: 'quiz123' });
      SurveyQuestion.find.mockResolvedValue([]);

      // Execute
      await getSurveyQuestions(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No survey questions found for this quiz'
      });
    });
  });

  describe('getSurveyQuestionById', () => {
    it('should get a single survey question successfully', async () => {
      // Setup
      req.params = {
        surveyquizId: 'quiz123',
        surveyquestionId: 'question123'
      };
      
      const mockQuestion = {
        _id: 'question123',
        title: 'Test Question',
        imageUrl: 'media123',
        toObject: jest.fn().mockReturnThis()
      };

      SurveyQuestion.findOne.mockResolvedValue(mockQuestion);
      Media.findById.mockResolvedValue({
        path: 'uploads\\test-image.jpg'
      });

      // Execute
      await getSurveyQuestionById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Survey question retrieved successfully',
        data: expect.objectContaining({
          _id: 'question123',
          imageUrl: expect.stringContaining('/uploads/test-image.jpg')
        })
      });
    });

    it('should return error if question not found', async () => {
      // Setup
      req.params = {
        surveyquizId: 'quiz123',
        surveyquestionId: 'nonexistent'
      };
      SurveyQuestion.findOne.mockResolvedValue(null);

      // Execute
      await getSurveyQuestionById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey question not found'
      });
    });
  });

  describe('updateSurveyQuestionById', () => {
    const mockUpdateData = {
      title: 'Updated Question',
      description: 'Updated Description',
      dimension: 'Updated Dimension',
      imageUrl: 'http://localhost:5000/uploads/new-image.jpg',
      answerOptions: [
        { optionText: 'New Option', color: '#00ff00' }
      ]
    };

    it('should update survey question successfully', async () => {
      // Setup
      req.params = {
        surveyquizId: 'quiz123',
        surveyquestionId: 'question123'
      };
      req.body = mockUpdateData;

      const mockQuestion = {
        _id: 'question123',
        ...mockUpdateData,
        save: jest.fn().mockResolvedValue(undefined),
        toObject: jest.fn().mockReturnValue({
          _id: 'question123',
          ...mockUpdateData
        })
      };

      SurveyQuestion.findOne.mockResolvedValue(mockQuestion);
      Media.findOne.mockResolvedValue({
        _id: 'media123',
        path: 'uploads\\new-image.jpg'
      });

      // Execute
      await updateSurveyQuestionById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Survey question updated successfully',
        data: expect.objectContaining({
          title: mockUpdateData.title
        })
      });
    });

    it('should return error if question not found', async () => {
      // Setup
      req.params = {
        surveyquizId: 'quiz123',
        surveyquestionId: 'nonexistent'
      };
      req.body = mockUpdateData;
      SurveyQuestion.findOne.mockResolvedValue(null);

      // Execute
      await updateSurveyQuestionById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey question not found'
      });
    });
  });

  describe('deleteSurveyQuestionById', () => {
    it('should delete survey question successfully', async () => {
      // Setup
      req.params = {
        surveyquizId: 'quiz123',
        surveyquestionId: 'question123'
      };
      
      SurveyQuestion.findOne.mockResolvedValue({
        _id: 'question123',
        surveyQuiz: 'quiz123'
      });
      SurveyQuestion.deleteOne.mockResolvedValue({ deletedCount: 1 });

      // Execute
      await deleteSurveyQuestionById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Survey question deleted successfully'
      });
    });

    it('should return error if question not found', async () => {
      // Setup
      req.params = {
        surveyquizId: 'quiz123',
        surveyquestionId: 'nonexistent'
      };
      SurveyQuestion.findOne.mockResolvedValue(null);

      // Execute
      await deleteSurveyQuestionById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey question not found'
      });
    });
  });
});