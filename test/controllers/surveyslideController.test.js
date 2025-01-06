const mongoose = require('mongoose');
const SurveySlide = require('../../models/surveySlide');
const SurveyQuiz = require('../../models/surveyQuiz');
const Media = require('../../models/Media');

// Mock the dependencies
jest.mock('../../models/surveySlide');
jest.mock('../../models/surveyQuiz');
jest.mock('../../models/Media');

const {
  addSurveySlide,
  getSurveySlides,
  getSurveySlide,
  updateSurveySlide,
  deleteSurveySlide
} = require('../../controllers/surveySlideController');

describe('Survey Slide Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3000')
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('addSurveySlide', () => {
    const mockSlideData = {
      surveyTitle: 'Test Survey Slide',
      surveyContent: 'Test Content',
      imageUrl: 'media123',
      position: 1
    };

    it('should create a survey slide successfully', async () => {
      // Setup
      req.params = { surveyQuizId: 'quiz123' };
      req.body = mockSlideData;

      const mockSurveyQuiz = {
        _id: 'quiz123',
        slides: [],
        save: jest.fn().mockResolvedValue(undefined)
      };

      const mockImage = {
        _id: 'media123',
        path: 'uploads\\test-image.jpg'
      };

      const mockNewSlide = {
        _id: 'slide123',
        ...mockSlideData,
        surveyQuiz: 'quiz123',
        save: jest.fn().mockResolvedValue(undefined),
        toObject: () => ({
          _id: 'slide123',
          ...mockSlideData,
          surveyQuiz: 'quiz123'
        })
      };

      SurveyQuiz.findById.mockResolvedValue(mockSurveyQuiz);
      Media.findById.mockResolvedValue(mockImage);
      SurveySlide.prototype.save = jest.fn().mockResolvedValue(mockNewSlide);
      
      const mockConstructor = jest.fn().mockImplementation(() => mockNewSlide);
      SurveySlide.mockImplementation(mockConstructor);

      // Execute
      await addSurveySlide(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey Slide added successfully',
        slide: expect.objectContaining({
          _id: 'slide123',
          surveyTitle: mockSlideData.surveyTitle,
          imageUrl: expect.stringContaining('/uploads/test-image.jpg')
        })
      });
      expect(mockSurveyQuiz.save).toHaveBeenCalled();
    });

    it('should return error if survey quiz not found', async () => {
      req.params = { surveyQuizId: 'nonexistent' };
      req.body = mockSlideData;
      SurveyQuiz.findById.mockResolvedValue(null);

      await addSurveySlide(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey Quiz not found'
      });
    });
  });

  describe('getSurveySlides', () => {
    it('should get all slides for a survey quiz successfully', async () => {
      req.params = { surveyQuizId: 'quiz123' };
      const mockSlides = [
        {
          _id: 'slide1',
          surveyTitle: 'Slide 1',
          imageUrl: { path: 'uploads\\image1.jpg' },
          toObject: () => ({
            _id: 'slide1',
            surveyTitle: 'Slide 1',
            imageUrl: { path: 'uploads\\image1.jpg' }
          })
        },
        {
          _id: 'slide2',
          surveyTitle: 'Slide 2',
          imageUrl: { path: 'uploads\\image2.jpg' },
          toObject: () => ({
            _id: 'slide2',
            surveyTitle: 'Slide 2',
            imageUrl: { path: 'uploads\\image2.jpg' }
          })
        }
      ];

      SurveyQuiz.findById.mockResolvedValue({ _id: 'quiz123' });
      SurveySlide.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockSlides)
        })
      });

      await getSurveySlides(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            _id: 'slide1',
            imageUrl: expect.stringContaining('/uploads/')
          })
        ])
      );
    });

    it('should return error if no slides found', async () => {
      req.params = { surveyQuizId: 'quiz123' };
      SurveyQuiz.findById.mockResolvedValue({ _id: 'quiz123' });
      SurveySlide.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue([])
        })
      });

      await getSurveySlides(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No slides found for this survey quiz'
      });
    });
  });

  describe('getSurveySlide', () => {
    it('should get a single survey slide successfully', async () => {
      req.params = { id: 'slide123' };
      
      const mockSlide = {
        _id: 'slide123',
        surveyTitle: 'Test Slide',
        imageUrl: { path: 'uploads\\test-image.jpg' },
        toObject: () => ({
          _id: 'slide123',
          surveyTitle: 'Test Slide',
          imageUrl: { path: 'uploads\\test-image.jpg' }
        })
      };

      SurveySlide.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSlide)
      });

      await getSurveySlide(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey Slide retrieved successfully',
        slide: expect.objectContaining({
          _id: 'slide123',
          imageUrl: expect.stringContaining('/uploads/test-image.jpg')
        })
      });
    });

    it('should return error if slide not found', async () => {
      req.params = { id: 'nonexistent' };
      SurveySlide.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      await getSurveySlide(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey Slide not found'
      });
    });
  });

  describe('updateSurveySlide', () => {
    const mockUpdateData = {
      surveyTitle: 'Updated Slide',
      surveyContent: 'Updated Content',
      imageUrl: 'http://localhost:3000/uploads/new-image.jpg',
      position: 2
    };

    it('should update survey slide successfully', async () => {
      req.params = { id: 'slide123' };
      req.body = mockUpdateData;

      const mockSlide = {
        _id: 'slide123',
        ...mockUpdateData,
        save: jest.fn().mockResolvedValue(undefined),
        toObject: () => ({
          _id: 'slide123',
          ...mockUpdateData
        })
      };

      SurveySlide.findById.mockResolvedValue(mockSlide);
      Media.findOne.mockResolvedValue({
        _id: 'media123',
        path: 'uploads\\new-image.jpg'
      });

      await updateSurveySlide(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey Slide updated successfully',
        data: expect.objectContaining({
          surveyTitle: mockUpdateData.surveyTitle
        })
      });
    });

    it('should return error if slide not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = mockUpdateData;
      SurveySlide.findById.mockResolvedValue(null);

      await updateSurveySlide(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey Slide not found'
      });
    });
  });

  describe('deleteSurveySlide', () => {
    it('should delete survey slide successfully', async () => {
      req.params = { id: 'slide123' };
      
      SurveySlide.findById.mockResolvedValue({
        _id: 'slide123'
      });
      SurveySlide.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await deleteSurveySlide(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey Slide deleted successfully'
      });
    });

    it('should return error if slide not found', async () => {
      req.params = { id: 'nonexistent' };
      SurveySlide.findById.mockResolvedValue(null);

      await deleteSurveySlide(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Survey Slide not found'
      });
    });
  });
});