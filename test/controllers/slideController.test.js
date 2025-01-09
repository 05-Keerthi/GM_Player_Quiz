const mongoose = require('mongoose');
const Slide = require('../../models/slide');
const Quiz = require('../../models/quiz');
const Media = require('../../models/Media');

// Mock the dependencies
jest.mock('../../models/slide');
jest.mock('../../models/quiz');
jest.mock('../../models/Media');

const {
  addSlide,
  getSlides,
  getSlide,
  updateSlide,
  deleteSlide
} = require('../../controllers/slideController');

describe('Slide Controller', () => {
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

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('addSlide', () => {
    const mockSlideData = {
      title: 'Test Slide',
      content: 'Test Content',
      type: 'classic',
      imageUrl: 'media123',
      position: 1
    };

    it('should add a slide successfully', async () => {
      // Setup
      req.params = { quizId: 'quiz123' };
      req.body = mockSlideData;

      const mockQuiz = {
        _id: 'quiz123',
        slides: [],
        save: jest.fn().mockResolvedValue(undefined)
      };

      const mockImage = {
        _id: 'media123',
        path: 'uploads\\test-image.jpg'
      };

      Quiz.findById.mockResolvedValue(mockQuiz);
      Media.findById.mockResolvedValue(mockImage);

      const mockNewSlide = {
        _id: 'slide123',
        ...mockSlideData,
        quiz: 'quiz123',
        save: jest.fn().mockResolvedValue(undefined),
        toObject: jest.fn().mockReturnValue({
          _id: 'slide123',
          ...mockSlideData,
          quiz: 'quiz123'
        })
      };

      Slide.mockImplementation(() => mockNewSlide);

      // Execute
      await addSlide(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ...mockNewSlide.toObject(),
        imageUrl: 'http://localhost:5000/uploads/test-image.jpg'
      }));
      expect(mockQuiz.save).toHaveBeenCalled();
      expect(mockNewSlide.save).toHaveBeenCalled();
    });

    it('should return error if quiz not found', async () => {
      // Setup
      req.params = { quizId: 'nonexistent' };
      req.body = mockSlideData;
      Quiz.findById.mockResolvedValue(null);

      // Execute
      await addSlide(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz not found'
      });
    });

    it('should return error if invalid slide type', async () => {
      // Setup
      req.params = { quizId: 'quiz123' };
      req.body = { ...mockSlideData, type: 'invalid_type' };
      Quiz.findById.mockResolvedValue({ _id: 'quiz123' });

      // Execute
      await addSlide(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid type. Valid types are: classic, big_title, bullet_points'
      });
    });
  });

  describe('getSlides', () => {
    it('should get all slides for a quiz successfully', async () => {
      // Setup
      req.params = { quizId: 'quiz123' };
      const mockSlides = [
        {
          _id: 'slide1',
          title: 'Slide 1',
          imageUrl: { path: 'uploads\\image1.jpg' },
          toObject: jest.fn().mockReturnThis()
        },
        {
          _id: 'slide2',
          title: 'Slide 2',
          imageUrl: { path: 'uploads\\image2.jpg' },
          toObject: jest.fn().mockReturnThis()
        }
      ];

      Quiz.findById.mockResolvedValue({ _id: 'quiz123' });
      Slide.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockSlides)
      });

      // Execute
      await getSlides(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            _id: 'slide1',
            imageUrl: expect.stringContaining('/uploads/image1.jpg')
          })
        ])
      );
    });

    it('should return error if no slides found', async () => {
      // Setup
      req.params = { quizId: 'quiz123' };
      Quiz.findById.mockResolvedValue({ _id: 'quiz123' });
      Slide.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([])
      });

      // Execute
      await getSlides(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No slides found for this quiz'
      });
    });
  });

  describe('getSlide', () => {
    it('should get a single slide successfully', async () => {
      // Setup
      req.params = { id: 'slide123' };
      const mockSlide = {
        _id: 'slide123',
        title: 'Test Slide',
        imageUrl: { path: 'uploads\\test-image.jpg' },
        toObject: jest.fn().mockReturnThis()
      };

      Slide.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSlide)
      });

      // Execute
      await getSlide(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Slide retrieved successfully',
        slide: expect.objectContaining({
          _id: 'slide123',
          imageUrl: expect.stringContaining('/uploads/test-image.jpg')
        })
      });
    });

    it('should return error if slide not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Slide.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await getSlide(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Slide not found'
      });
    });
  });

  describe('updateSlide', () => {
    const mockUpdateData = {
      title: 'Updated Slide',
      content: 'Updated Content',
      type: 'big_title',
      imageUrl: 'http://localhost:3000/uploads/new-image.jpg',
      position: 2
    };

    it('should update slide successfully', async () => {
      // Setup
      req.params = { id: 'slide123' };
      req.body = mockUpdateData;

      const mockSlide = {
        _id: 'slide123',
        ...mockUpdateData,
        save: jest.fn().mockResolvedValue(undefined)
      };

      const mockMedia = { _id: 'media123', path: 'uploads/new-image.jpg' };

      Slide.findById.mockResolvedValueOnce(mockSlide)
        .mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue({
            ...mockSlide,
            imageUrl: mockMedia,
            toObject: jest.fn().mockReturnValue(mockSlide)
          })
        });

      Media.findOne.mockResolvedValue(mockMedia);

      // Execute
      await updateSlide(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Slide updated successfully',
        slide: expect.objectContaining({
          title: mockUpdateData.title
        })
      });
    });

    it('should return error if slide not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      req.body = mockUpdateData;
      Slide.findById.mockResolvedValue(null);

      // Execute
      await updateSlide(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Slide not found'
      });
    });
  });

  describe('deleteSlide', () => {
    it('should delete slide successfully', async () => {
      // Setup
      req.params = { id: 'slide123' };
      Slide.findById.mockResolvedValue({ _id: 'slide123' });
      Slide.deleteOne.mockResolvedValue({ deletedCount: 1 });

      // Execute
      await deleteSlide(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Slide deleted successfully'
      });
    });

    it('should return error if slide not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Slide.findById.mockResolvedValue(null);

      // Execute
      await deleteSlide(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Slide not found'
      });
    });
  });
});