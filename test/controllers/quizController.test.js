const Quiz = require('../../models/quiz');
const Category = require('../../models/category');
const Slide = require('../../models/slide');
const Question = require('../../models/question');
const Media = require('../../models/Media');
const ActivityLog = require('../../models/ActivityLog');

// Mock dependencies
jest.mock('../../models/quiz');
jest.mock('../../models/category');
jest.mock('../../models/slide');
jest.mock('../../models/question');
jest.mock('../../models/Media');
jest.mock('../../models/ActivityLog');

const {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  closeQuiz,
} = require('../../controllers/quizController');

describe('Quiz Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: {
        _id: 'user123',
        username: 'testuser',
      },
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:5000'),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    process.env.HOST = 'http://localhost:5000/uploads/';
    jest.clearAllMocks();
  });

  describe('createQuiz', () => {
    const mockQuizData = {
      title: 'Test Quiz',
      description: 'Test Description',
      categoryId: ['category1', 'category2'],
      slides: ['slide1', 'slide2'],
      questions: ['question1', 'question2'],
      tenantId: 'tenant123',
      duration: 30,
      order: [
        { id: 'slide1', type: 'slide' },
        { id: 'question1', type: 'question' },
        { id: 'slide2', type: 'slide' },
        { id: 'question2', type: 'question' },
      ],
    };

    it('should create a quiz successfully', async () => {
      // Setup
      req.body = mockQuizData;
      Category.find.mockResolvedValue([{ _id: 'category1' }, { _id: 'category2' }]);
      Slide.find.mockResolvedValue([{ _id: 'slide1' }, { _id: 'slide2' }]);
      Question.find.mockResolvedValue([{ _id: 'question1' }, { _id: 'question2' }]);

      const mockQuiz = {
        ...mockQuizData,
        _id: 'quiz123',
        save: jest.fn().mockResolvedValue(true),
      };
      Quiz.mockImplementation(() => mockQuiz);
      ActivityLog.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true),
      }));

      // Execute
      await createQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz created successfully',
        quiz: expect.objectContaining(mockQuizData),
      });
      expect(ActivityLog).toHaveBeenCalled();
    });

    it('should return 400 if categoryId is missing', async () => {
      // Setup
      req.body = { ...mockQuizData, categoryId: null };

      // Execute
      await createQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'At least one Category ID is required.',
      });
    });

    it('should validate order array correctly', async () => {
      // Setup
      req.body = {
        ...mockQuizData,
        order: [
          { id: 'invalid', type: 'slide' },
          { id: 'question1', type: 'question' },
        ],
      };
      Category.find.mockResolvedValue([{ _id: 'category1' }, { _id: 'category2' }]);
      Slide.find.mockResolvedValue([{ _id: 'slide1' }, { _id: 'slide2' }]);
      Question.find.mockResolvedValue([{ _id: 'question1' }, { _id: 'question2' }]);

      // Execute
      await createQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Invalid order entry'),
      });
    });
  });

  describe('getQuizzes', () => {
  const mockQuizzes = [
    {
      _id: 'quiz1',
      title: 'Quiz 1',
      slides: [
        { _id: 'slide1', imageUrl: 'media1', toObject: () => ({ _id: 'slide1', imageUrl: 'media1' }) },
      ],
      questions: [
        { _id: 'question1', imageUrl: 'media2', toObject: () => ({ _id: 'question1', imageUrl: 'media2' }) },
      ],
      toObject: () => ({
        _id: 'quiz1',
        title: 'Quiz 1',
        slides: [{ _id: 'slide1', imageUrl: 'media1' }],
        questions: [{ _id: 'question1', imageUrl: 'media2' }],
      }),
    },
    {
      _id: 'quiz2',
      title: 'Quiz 2',
      slides: [],
      questions: [],
      toObject: () => ({
        _id: 'quiz2',
        title: 'Quiz 2',
        slides: [],
        questions: [],
      }),
    },
  ];

  it('should return all quizzes with processed image URLs', async () => {
    // Setup
    Quiz.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockQuizzes),
        }),
      }),
    });

    Media.findById.mockImplementation((id) => ({
      path: `uploads/${id}.jpg`,
    }));

    // Execute
    await getQuizzes(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          _id: 'quiz1',
          slides: expect.arrayContaining([
            expect.objectContaining({
              imageUrl: expect.stringContaining('http://localhost:5000/uploads/'),
            }),
          ]),
        }),
        expect.objectContaining({
          _id: 'quiz2',
        }),
      ])
    );
  });

  it('should return 500 if there is a server error', async () => {
    // Setup
    Quiz.find.mockRejectedValue(new Error('Server error'));

    // Execute
    await getQuizzes(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: 'Server error',
    });
  });
});

  describe('getQuizById', () => {
    const mockQuiz = {
      _id: 'quiz1',
      title: 'Quiz 1',
      slides: [
        { _id: 'slide1', imageUrl: 'media1', toObject: () => ({ _id: 'slide1', imageUrl: 'media1' }) },
      ],
      questions: [
        { _id: 'question1', imageUrl: 'media2', toObject: () => ({ _id: 'question1', imageUrl: 'media2' }) },
      ],
      toObject: () => ({
        _id: 'quiz1',
        title: 'Quiz 1',
        slides: [
          { _id: 'slide1', imageUrl: 'media1' },
        ],
        questions: [
          { _id: 'question1', imageUrl: 'media2' },
        ],
      }),
    };

    it('should return quiz by ID with processed image URLs', async () => {
      // Setup
      req.params.id = 'quiz1';
      Quiz.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockQuiz),
          }),
        }),
      });

      Media.findById.mockImplementation((id) => ({
        path: `uploads/${id}.jpg`,
      }));

      // Execute
      await getQuizById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'quiz1',
          slides: expect.arrayContaining([
            expect.objectContaining({
              imageUrl: expect.stringContaining('http://localhost:5000/uploads/'),
            }),
          ]),
        })
      );
    });

    it('should return 404 if quiz not found', async () => {
      // Setup
      req.params.id = 'nonexistent';
      Quiz.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      // Execute
      await getQuizById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz not found',
      });
    });
  });

  describe('updateQuiz', () => {
    it('should update quiz successfully', async () => {
      // Setup
      req.params.id = 'quiz1';
      req.body = {
        title: 'Updated Quiz',
        description: 'Updated Description',
      };
      const updatedQuiz = {
        _id: 'quiz1',
        ...req.body,
      };
      Quiz.findByIdAndUpdate.mockResolvedValue(updatedQuiz);

      // Execute
      await updateQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz updated successfully',
        quiz: updatedQuiz,
      });
    });

    it('should return 404 if quiz not found', async () => {
      // Setup
      req.params.id = 'nonexistent';
      Quiz.findByIdAndUpdate.mockResolvedValue(null);

      // Execute
      await updateQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz not found',
      });
    });
  });

  describe('deleteQuiz', () => {
    it('should delete quiz successfully', async () => {
      // Setup
      req.params.id = 'quiz1';
      Quiz.findByIdAndDelete.mockResolvedValue({ _id: 'quiz1' });

      // Execute
      await deleteQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz deleted successfully',
      });
    });

    it('should return 404 if quiz not found', async () => {
      // Setup
      req.params.id = 'nonexistent';
      Quiz.findByIdAndDelete.mockResolvedValue(null);

      // Execute
      await deleteQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz not found',
      });
    });
  });

  describe('publishQuiz', () => {
    it('should publish quiz successfully', async () => {
      // Setup
      req.params.id = 'quiz1';
      const publishedQuiz = {
        _id: 'quiz1',
        status: 'active',
      };
      Quiz.findByIdAndUpdate.mockResolvedValue(publishedQuiz);

      // Execute
      await publishQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz published successfully',
        quiz: publishedQuiz,
      });
    });

    it('should return 404 if quiz not found', async () => {
      // Setup
      req.params.id = 'nonexistent';
      Quiz.findByIdAndUpdate.mockResolvedValue(null);

      // Execute
      await publishQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz not found',
      });
    });
  });

  describe('closeQuiz', () => {
    it('should close quiz successfully', async () => {
      // Setup
      req.params.id = 'quiz1';
      const closedQuiz = {
        _id: 'quiz1',
        status: 'closed',
      };
      Quiz.findByIdAndUpdate.mockResolvedValue(closedQuiz);

      // Execute
      await closeQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz closed successfully',
        quiz: closedQuiz,
      });
    });

    it('should return 404 if quiz not found', async () => {
      // Setup
      req.params.id = 'nonexistent';
      Quiz.findByIdAndUpdate.mockResolvedValue(null);

      // Execute
      await closeQuiz(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz not found',
      });
    });
  });
});