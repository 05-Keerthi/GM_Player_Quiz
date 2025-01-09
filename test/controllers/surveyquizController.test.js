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

describe('SurveyQuiz Controller', () => {
    let req;
    let res;
    let mockToObject;
  
    beforeEach(() => {
      mockToObject = jest.fn().mockImplementation(function() {
        return { ...this };
      });
  
      req = {
        params: {},
        body: {},
        user: {
          _id: 'user123',
          username: 'testuser'
        },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:5000')
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
  
      process.env.HOST = 'http://localhost:5000';
      jest.clearAllMocks();
    });
  
    afterEach(() => {
      jest.resetAllMocks();
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
      const mockSurveyQuizData = {
        title: 'Test Survey Quiz',
        description: 'Test Description',
        categoryId: ['category123'],
        slides: ['slide123'],
        questions: ['question123'],
        isPublic: true,
        order: [
          { id: 'slide123', type: 'slide' },
          { id: 'question123', type: 'question' }
        ]
      };
  
      it('should create a survey quiz successfully', async () => {
        req.body = mockSurveyQuizData;
  
        const mockPopulatedData = {
          ...mockSurveyQuizData,
          _id: 'quiz123',
          categories: [{ _id: 'category123', name: 'Test Category' }],
          slides: [{ _id: 'slide123', title: 'Test Slide' }],
          questions: [{ _id: 'question123', text: 'Test Question' }],
          toObject: mockToObject
        };
  
        Category.find.mockResolvedValue([{ _id: 'category123' }]);
        SurveySlide.find.mockResolvedValue([{ _id: 'slide123' }]);
        SurveyQuestion.find.mockResolvedValue([{ _id: 'question123' }]);
  
        const mockQuiz = {
          ...mockSurveyQuizData,
          _id: 'quiz123',
          save: jest.fn().mockResolvedValue(mockPopulatedData)
        };
  
        SurveyQuiz.mockImplementation(() => mockQuiz);
  
        SurveyQuiz.findById.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          populate: jest.fn().mockResolvedValue(mockPopulatedData)
        });
  
        await createSurveyQuiz(req, res);
      });
  
      it('should return error if no categories provided', async () => {
        req.body = { ...mockSurveyQuizData, categoryId: [] };
  
        await createSurveyQuiz(req, res);
  
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'At least one Category ID is required.'
        });
      });
  
      it('should return error if invalid categories provided', async () => {
        req.body = mockSurveyQuizData;
        Category.find.mockResolvedValue([]);
  
        await createSurveyQuiz(req, res);
  
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Some categories are invalid.'
        });
      });
    });
  
    describe('getAllSurveyQuizzes', () => {
      it('should get all survey quizzes successfully', async () => {
        const mockSlide = {
          _id: 'slide1',
          imageUrl: 'media1',
          toObject: mockToObject
        };
  
        const mockQuestion = {
          _id: 'question1',
          imageUrl: 'media2',
          toObject: mockToObject
        };
  
        const mockSurveyQuiz = {
          _id: 'quiz123',
          title: 'Test Quiz',
          slides: [mockSlide],
          questions: [mockQuestion],
          toObject: mockToObject
        };
  
        SurveyQuiz.find.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          populate: jest.fn().mockResolvedValue([mockSurveyQuiz])
        });
  
        Media.findById.mockImplementation((id) => {
          return Promise.resolve({
            path: id === 'media1' ? 'uploads/slide-image.jpg' : 'uploads/question-image.jpg'
          });
        });
  
        await getAllSurveyQuizzes(req, res);
      });
    });
  
    describe('getSurveyQuizById', () => {
      it('should get a single survey quiz successfully', async () => {
        req.params.id = 'quiz123';
  
        const mockSlide = {
          _id: 'slide1',
          imageUrl: 'media1',
          toObject: mockToObject
        };
  
        const mockQuestion = {
          _id: 'question1',
          imageUrl: 'media2',
          toObject: mockToObject
        };
  
        const mockSurveyQuiz = {
          _id: 'quiz123',
          title: 'Test Quiz',
          slides: [mockSlide],
          questions: [mockQuestion],
          toObject: mockToObject
        };
  
        SurveyQuiz.findById.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          populate: jest.fn().mockResolvedValue(mockSurveyQuiz)
        });
  
        Media.findById.mockImplementation((id) => {
          return Promise.resolve({
            path: id === 'media1' ? 'uploads/slide-image.jpg' : 'uploads/question-image.jpg'
          });
        });
  
        await getSurveyQuizById(req, res);
      });
  
      it('should return error if survey quiz not found', async () => {
        req.params.id = 'nonexistent';
  
        SurveyQuiz.findById.mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          populate: jest.fn().mockReturnThis(),
          populate: jest.fn().mockResolvedValue(null)
        });
  
        await getSurveyQuizById(req, res);
      });
    });
  
    describe('updateSurveyQuiz', () => {
      const mockUpdateData = {
        title: 'Updated Quiz',
        description: 'Updated Description',
        slides: ['slide123'],
        questions: ['question123'],
        order: [
          { id: 'slide123', type: 'slide' },
          { id: 'question123', type: 'question' }
        ]
      };
  
      it('should update survey quiz successfully', async () => {
        req.params.id = 'quiz123';
        req.body = mockUpdateData;
  
        const mockUpdatedQuiz = {
          _id: 'quiz123',
          ...mockUpdateData,
          save: jest.fn().mockResolvedValue({ _id: 'quiz123', ...mockUpdateData })
        };
  
        SurveyQuiz.findById.mockResolvedValue(mockUpdatedQuiz);
        SurveyQuestion.find.mockResolvedValue([{ _id: 'question123' }]);
        SurveySlide.find.mockResolvedValue([{ _id: 'slide123' }]);
  
        await updateSurveyQuiz(req, res);
  
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          message: 'SurveyQuiz updated successfully',
          surveyQuiz: expect.objectContaining({
            title: mockUpdateData.title
          })
        });
      });
  
      it('should return error if survey quiz not found', async () => {
        req.params.id = 'nonexistent';
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
        req.params.id = 'quiz123';
  
        const mockQuiz = {
          _id: 'quiz123',
          title: 'Test Quiz'
        };
  
        SurveyQuiz.findById.mockResolvedValue(mockQuiz);
        SurveyQuiz.deleteOne.mockResolvedValue({ deletedCount: 1 });
  
        await deleteSurveyQuiz(req, res);
  
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          message: 'SurveyQuiz deleted successfully'
        });
      });
  
      it('should return error if survey quiz not found', async () => {
        req.params.id = 'nonexistent';
  
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
        req.params.id = 'quiz123';
  
        const mockPublishedQuiz = {
          _id: 'quiz123',
          status: 'active'
        };
  
        SurveyQuiz.findByIdAndUpdate.mockResolvedValue(mockPublishedQuiz);
  
        await publishSurveyQuiz(req, res);
  
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Survey quiz published successfully',
          surveyQuiz: mockPublishedQuiz
        });
      });
  
      it('should return error if survey quiz not found', async () => {
        req.params.id = 'nonexistent';
  
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
        req.params.id = 'quiz123';
  
        const mockClosedQuiz = {
          _id: 'quiz123',
          status: 'closed'
        };
  
        SurveyQuiz.findByIdAndUpdate.mockResolvedValue(mockClosedQuiz);
  
        await closeSurveyQuiz(req, res);
  
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Survey quiz closed successfully',
          surveyQuiz: mockClosedQuiz
        });
      });
  
      it('should return error if survey quiz not found', async () => {
        req.params.id = 'nonexistent';
  
        SurveyQuiz.findByIdAndUpdate.mockResolvedValue(null);
  
        await closeSurveyQuiz(req, res);
  
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Survey quiz not found'
        });
      });
    });
  });