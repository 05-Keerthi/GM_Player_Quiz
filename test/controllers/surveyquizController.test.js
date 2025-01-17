const mongoose = require('mongoose');
const Category = require('../../models/category');
const SurveySlide = require('../../models/surveySlide');
const SurveyQuestion = require('../../models/surveyQuestion');
const SurveyQuiz = require('../../models/surveyQuiz');
const Media = require('../../models/Media');

// Mock all dependencies
jest.mock('../../models/category');
jest.mock('../../models/surveySlide');
jest.mock('../../models/surveyQuestion');
jest.mock('../../models/surveyQuiz');
jest.mock('../../models/Media');

const {
  createSurveyQuiz,
  getAllSurveyQuizzes,
  getSurveyQuizById,
  updateSurveyQuiz,
  deleteSurveyQuiz,
  publishSurveyQuiz,
  closeSurveyQuiz
} = require('../../controllers/surveyQuizController');

describe('Survey Quiz Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:5000'),
      user: { _id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    process.env.HOST = 'http://localhost:5000';
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

  describe('createSurveyQuiz', () => {
    const mockQuizData = {
      title: 'Test Survey Quiz',
      description: 'Test Description',
      categoryId: ['category123'],
      slides: ['slide123'],
      questions: ['question123'],
      isPublic: true,
      order: [
        { id: 'slide123', type: 'slide' },
        { id: 'question123', type: 'question' }
      ],
      type: 'survey'
    };

    it('should create a survey quiz successfully', async () => {
      req.body = mockQuizData;

      const mockPopulatedQuiz = {
        _id: 'quiz123',
        ...mockQuizData,
        categories: [{ _id: 'category123', name: 'Test Category' }],
        slides: [{ _id: 'slide123', title: 'Test Slide' }],
        questions: [{ _id: 'question123', title: 'Test Question' }],
        createdBy: 'user123',
        status: 'draft'
      };

      Category.find.mockResolvedValue([{ _id: 'category123' }]);
      SurveySlide.find.mockResolvedValue([{ _id: 'slide123' }]);
      SurveyQuestion.find.mockResolvedValue([{ _id: 'question123' }]);

      const mockSaveResponse = {
        ...mockPopulatedQuiz,
        save: jest.fn().mockResolvedValue(mockPopulatedQuiz)
      };

      SurveyQuiz.mockImplementation(() => mockSaveResponse);

      const populateChain = {
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockPopulatedQuiz)
      };

      SurveyQuiz.findById.mockReturnValue(populateChain);

      await createSurveyQuiz(req, res);
    });

    it('should return error if type is invalid', async () => {
      req.body = { ...mockQuizData, type: 'invalid' };

      await createSurveyQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Valid type (survey or ArtPulse) is required.'
      });
    });

    it('should return error if categoryId is missing', async () => {
      const { categoryId, ...dataWithoutCategory } = mockQuizData;
      req.body = dataWithoutCategory;

      await createSurveyQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'At least one Category ID is required.'
      });
    });

    it('should return error if some categories are invalid', async () => {
      req.body = mockQuizData;
      Category.find.mockResolvedValue([]); // No categories found

      await createSurveyQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Some categories are invalid.'
      });
    });
  });

  describe('getAllSurveyQuizzes', () => {
    it('should get all survey quizzes successfully', async () => {
      const mockQuizzes = [{
        _id: 'quiz123',
        title: 'Test Quiz',
        slides: [{ 
          _id: 'slide123',
          imageUrl: 'media1',
          toObject: () => ({ _id: 'slide123', imageUrl: 'media1' })
        }],
        questions: [{ 
          _id: 'question123',
          imageUrl: 'media2',
          toObject: () => ({ _id: 'question123', imageUrl: 'media2' })
        }],
        toObject: () => ({
          _id: 'quiz123',
          title: 'Test Quiz',
          slides: [{ _id: 'slide123', imageUrl: 'media1' }],
          questions: [{ _id: 'question123', imageUrl: 'media2' }]
        })
      }];

      const populateChain = {
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockQuizzes)
      };

      SurveyQuiz.find.mockReturnValue(populateChain);

      Media.findById.mockImplementation((id) => ({
        path: `uploads/${id}-image.jpg`
      }));

      await getAllSurveyQuizzes(req, res);
    });
  });

  describe('getSurveyQuizById', () => {
    it('should get a single survey quiz successfully', async () => {
      req.params = { id: 'quiz123' };
      
      const mockQuiz = {
        _id: 'quiz123',
        title: 'Test Quiz',
        slides: [{ 
          imageUrl: 'media1',
          toObject: () => ({ imageUrl: 'media1' })
        }],
        questions: [{ 
          imageUrl: 'media2',
          toObject: () => ({ imageUrl: 'media2' })
        }],
        toObject: () => ({
          _id: 'quiz123',
          title: 'Test Quiz',
          slides: [{ imageUrl: 'media1' }],
          questions: [{ imageUrl: 'media2' }]
        })
      };

      const populateChain = {
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockQuiz)
      };

      SurveyQuiz.findById.mockReturnValue(populateChain);

      Media.findById.mockResolvedValue({
        path: 'uploads/test-image.jpg'
      });

      await getSurveyQuizById(req, res);
    });

    it('should return error if quiz not found', async () => {
      req.params = { id: 'nonexistent' };

      const populateChain = {
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null)
      };

      SurveyQuiz.findById.mockReturnValue(populateChain);

      await getSurveyQuizById(req, res);
    });
  });

  describe('updateSurveyQuiz', () => {
    const mockUpdateData = {
      title: 'Updated Quiz',
      description: 'Updated Description',
      slides: ['slide123'],
      questions: ['question123'],
      isPublic: false,
      status: 'draft'
    };

    it('should update survey quiz successfully', async () => {
      req.params = { id: 'quiz123' };
      req.body = mockUpdateData;

      const mockQuiz = {
        _id: 'quiz123',
        ...mockUpdateData,
        save: jest.fn().mockResolvedValue({
          _id: 'quiz123',
          ...mockUpdateData
        })
      };

      SurveyQuiz.findById.mockResolvedValue(mockQuiz);
      SurveySlide.find.mockResolvedValue([{ _id: 'slide123' }]);
      SurveyQuestion.find.mockResolvedValue([{ _id: 'question123' }]);

      await updateSurveyQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'SurveyQuiz updated successfully',
        surveyQuiz: expect.objectContaining({
          title: mockUpdateData.title
        })
      });
    });

    it('should return error if quiz not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = mockUpdateData;

      SurveyQuiz.findById.mockResolvedValue(null);

      await updateSurveyQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'SurveyQuiz not found'
      });
    });
  });

  describe('deleteSurveyQuiz', () => {
    it('should delete survey quiz successfully', async () => {
      req.params = { id: 'quiz123' };
      
      SurveyQuiz.findById.mockResolvedValue({ _id: 'quiz123' });
      SurveyQuiz.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await deleteSurveyQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'SurveyQuiz deleted successfully'
      });
    });

    it('should return error if quiz not found', async () => {
      req.params = { id: 'nonexistent' };
      
      SurveyQuiz.findById.mockResolvedValue(null);

      await deleteSurveyQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'SurveyQuiz not found'
      });
    });
  });

  describe('publishSurveyQuiz', () => {
    it('should publish survey quiz successfully', async () => {
      req.params = { id: 'quiz123' };
      
      const mockQuiz = {
        _id: 'quiz123',
        status: 'active'
      };

      SurveyQuiz.findByIdAndUpdate.mockResolvedValue(mockQuiz);

      await publishSurveyQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey quiz published successfully',
        surveyQuiz: mockQuiz
      });
    });

    it('should return error if quiz not found', async () => {
      req.params = { id: 'nonexistent' };

      SurveyQuiz.findByIdAndUpdate.mockResolvedValue(null);

      await publishSurveyQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey quiz not found'
      });
    });
  });

  describe('closeSurveyQuiz', () => {
    it('should close survey quiz successfully', async () => {
      req.params = { id: 'quiz123' };
      
      const mockQuiz = {
        _id: 'quiz123',
        status: 'closed'
      };

      SurveyQuiz.findByIdAndUpdate.mockResolvedValue(mockQuiz);

      await closeSurveyQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey quiz closed successfully',
        surveyQuiz: mockQuiz
      });
    });

    it('should return error if quiz not found', async () => {
      req.params = { id: 'nonexistent' };

      SurveyQuiz.findByIdAndUpdate.mockResolvedValue(null);

      await closeSurveyQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey quiz not found'
      });
    });
  });
});