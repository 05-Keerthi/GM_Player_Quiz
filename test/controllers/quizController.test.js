const mongoose = require('mongoose');
const Quiz = require('../../models/quiz');
const Category = require('../../models/category');
const Slide = require('../../models/slide');
const Question = require('../../models/question');
const Media = require('../../models/Media');
const ActivityLog = require('../../models/ActivityLog');
const User = require('../../models/User');

// Mock all dependencies
jest.mock('../../models/quiz');
jest.mock('../../models/category');
jest.mock('../../models/slide');
jest.mock('../../models/question');
jest.mock('../../models/Media');
jest.mock('../../models/ActivityLog');
jest.mock('../../models/User');

const {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  closeQuiz
} = require('../../controllers/quizController');

describe('Quiz Controller', () => {
  let req;
  let res;

  beforeEach(() => {
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

  describe('createQuiz', () => {
    const mockQuizData = {
      title: 'Test Quiz',
      description: 'Test Description',
      categoryId: ['category123'],
      slides: ['slide123'],
      questions: ['question123'],
      tenantId: 'tenant123',
      duration: 30,
      order: [
        { id: 'slide123', type: 'slide' },
        { id: 'question123', type: 'question' }
      ]
    };

    it('should create a quiz successfully', async () => {
      // Setup
      req.body = mockQuizData;

      Category.find.mockResolvedValue([{ _id: 'category123' }]);
      Slide.find.mockResolvedValue([{ _id: 'slide123' }]);
      Question.find.mockResolvedValue([{ _id: 'question123' }]);

      const mockQuiz = {
        ...mockQuizData,
        _id: 'quiz123',
        save: jest.fn().mockResolvedValue(undefined)
      };

      Quiz.mockImplementation(() => mockQuiz);
      ActivityLog.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(undefined)
      }));

      // Execute
      await createQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz created successfully',
        quiz: expect.objectContaining({
          title: mockQuizData.title
        })
      });
    });

    it('should return error if no categories provided', async () => {
      // Setup
      req.body = { ...mockQuizData, categoryId: [] };

      // Execute
      await createQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'At least one Category ID is required.'
      });
    });

    it('should return error if invalid categories provided', async () => {
      // Setup
      req.body = mockQuizData;
      Category.find.mockResolvedValue([]);

      // Execute
      await createQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Some categories are invalid.'
      });
    });
  });

  describe('getQuizzes', () => {
    it('should get all quizzes successfully', async () => {
      // Setup
      const mockQuizzes = [
        {
          _id: 'quiz123',
          title: 'Quiz 1',
          slides: [
            { _id: 'slide1', imageUrl: 'media1', toObject: jest.fn().mockReturnThis() }
          ],
          questions: [
            { _id: 'question1', imageUrl: 'media2', toObject: jest.fn().mockReturnThis() }
          ],
          toObject: jest.fn().mockReturnThis()
        }
      ];

      Quiz.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockQuizzes)
      });

      Media.findById.mockResolvedValue({
        path: 'uploads\\test-image.jpg'
      });

      // Execute
      await getQuizzes(req, res);

    });
  });

  describe('getQuizById', () => {
    it('should get a single quiz successfully', async () => {
      // Setup
      req.params = { id: 'quiz123' };
      const mockQuiz = {
        _id: 'quiz123',
        title: 'Test Quiz',
        slides: [
          { _id: 'slide1', imageUrl: 'media1', toObject: jest.fn().mockReturnThis() }
        ],
        questions: [
          { _id: 'question1', imageUrl: 'media2', toObject: jest.fn().mockReturnThis() }
        ],
        toObject: jest.fn().mockReturnThis()
      };

      Quiz.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockQuiz)
      });

      Media.findById.mockResolvedValue({
        path: 'uploads\\test-image.jpg'
      });

      // Execute
      await getQuizById(req, res);

    });

    it('should return error if quiz not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Quiz.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await getQuizById(req, res);
    });
  });

  describe('updateQuiz', () => {
    it('should update quiz successfully', async () => {
      // Setup
      req.params = { id: 'quiz123' };
      req.body = { title: 'Updated Quiz' };

      const mockUpdatedQuiz = {
        _id: 'quiz123',
        title: 'Updated Quiz'
      };

      Quiz.findByIdAndUpdate.mockResolvedValue(mockUpdatedQuiz);

      // Execute
      await updateQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz updated successfully',
        quiz: mockUpdatedQuiz
      });
    });

    it('should return error if quiz not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Quiz.findByIdAndUpdate.mockResolvedValue(null);

      // Execute
      await updateQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz not found'
      });
    });
  });

  describe('deleteQuiz', () => {
    it('should delete quiz successfully', async () => {
      // Setup
      req.params = { id: 'quiz123' };
      Quiz.findByIdAndDelete.mockResolvedValue({ _id: 'quiz123' });

      // Execute
      await deleteQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz deleted successfully'
      });
    });

    it('should return error if quiz not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Quiz.findByIdAndDelete.mockResolvedValue(null);

      // Execute
      await deleteQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz not found'
      });
    });
  });

  describe('publishQuiz', () => {
    it('should publish quiz successfully', async () => {
      // Setup
      req.params = { id: 'quiz123' };
      const mockPublishedQuiz = {
        _id: 'quiz123',
        status: 'active'
      };

      Quiz.findByIdAndUpdate.mockResolvedValue(mockPublishedQuiz);

      // Execute
      await publishQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz published successfully',
        quiz: mockPublishedQuiz
      });
    });

    it('should return error if quiz not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Quiz.findByIdAndUpdate.mockResolvedValue(null);

      // Execute
      await publishQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz not found'
      });
    });
  });

  describe('closeQuiz', () => {
    it('should close quiz successfully', async () => {
      // Setup
      req.params = { id: 'quiz123' };
      const mockClosedQuiz = {
        _id: 'quiz123',
        status: 'closed'
      };

      Quiz.findByIdAndUpdate.mockResolvedValue(mockClosedQuiz);

      // Execute
      await closeQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz closed successfully',
        quiz: mockClosedQuiz
      });
    });

    it('should return error if quiz not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Quiz.findByIdAndUpdate.mockResolvedValue(null);

      // Execute
      await closeQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz not found'
      });
    });
  });
});