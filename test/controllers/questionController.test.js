const mongoose = require('mongoose');
const Question = require('../../models/question');
const Quiz = require('../../models/quiz');
const Media = require('../../models/Media');

// Mock the dependencies
jest.mock('../../models/question');
jest.mock('../../models/quiz');
jest.mock('../../models/Media');

const {
  addQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion
} = require('../../controllers/questionController');

describe('Question Controller', () => {
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

  describe('addQuestion', () => {
    const mockQuestionData = {
      title: 'Test Question',
      type: 'multiple-choice',
      imageUrl: 'media123',
      options: [
        { text: 'Option 1', color: 'red', isCorrect: true },
        { text: 'Option 2', color: 'blue', isCorrect: false }
      ],
      correctAnswer: 'Option 1',
      points: 10,
      timer: 30
    };

    it('should add a question successfully', async () => {
      // Setup
      req.params = { quizId: 'quiz123' };
      req.body = mockQuestionData;

      const mockQuiz = {
        _id: 'quiz123',
        questions: [],
        save: jest.fn().mockResolvedValue(undefined)
      };

      const mockImage = {
        _id: 'media123',
        path: 'uploads\\test-image.jpg'
      };

      Quiz.findById.mockResolvedValue(mockQuiz);
      Media.findById.mockResolvedValue(mockImage);

      const mockNewQuestion = {
        _id: 'question123',
        ...mockQuestionData,
        quiz: 'quiz123',
        save: jest.fn().mockResolvedValue(undefined),
        toObject: jest.fn().mockReturnValue({
          _id: 'question123',
          ...mockQuestionData,
          quiz: 'quiz123'
        })
      };

      Question.mockImplementation(() => mockNewQuestion);

      // Execute
      await addQuestion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        ...mockNewQuestion.toObject(),
        imageUrl: 'http://localhost:5000/uploads/test-image.jpg'
      }));
      expect(mockQuiz.save).toHaveBeenCalled();
      expect(mockNewQuestion.save).toHaveBeenCalled();
    });

    it('should return error if quiz not found', async () => {
      // Setup
      req.params = { quizId: 'nonexistent' };
      req.body = mockQuestionData;
      Quiz.findById.mockResolvedValue(null);

      // Execute
      await addQuestion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Quiz not found'
      });
    });

    it('should return error if image not found', async () => {
      // Setup
      req.params = { quizId: 'quiz123' };
      req.body = mockQuestionData;
      Quiz.findById.mockResolvedValue({ _id: 'quiz123', questions: [], save: jest.fn() });
      Media.findById.mockResolvedValue(null);

      // Execute
      await addQuestion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Image not found'
      });
    });
  });

  describe('getQuestions', () => {
    it('should get all questions for a quiz successfully', async () => {
      // Setup
      req.params = { quizId: 'quiz123' };
      const mockQuestions = [
        {
          _id: 'question1',
          title: 'Question 1',
          imageUrl: { path: 'uploads\\image1.jpg' },
          toObject: jest.fn().mockReturnThis()
        },
        {
          _id: 'question2',
          title: 'Question 2',
          imageUrl: { path: 'uploads\\image2.jpg' },
          toObject: jest.fn().mockReturnThis()
        }
      ];

      Question.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuestions)
      });

      // Execute
      await getQuestions(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            _id: 'question1',
            imageUrl: 'http://localhost:5000/uploads/image1.jpg'
          })
        ])
      );
    });

    it('should return error if no questions found', async () => {
      // Setup
      req.params = { quizId: 'quiz123' };
      Question.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });

      // Execute
      await getQuestions(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No questions found for this quiz'
      });
    });
  });

  describe('getQuestionById', () => {
    it('should get a single question successfully', async () => {
      // Setup
      req.params = { id: 'question123' };
      const mockQuestion = {
        _id: 'question123',
        title: 'Test Question',
        imageUrl: { path: 'uploads\\test-image.jpg' },
        toObject: jest.fn().mockReturnThis()
      };

      Question.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockQuestion)
      });

      // Execute
      await getQuestionById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'question123',
          imageUrl: 'http://localhost:5000/uploads/test-image.jpg'
        })
      );
    });

    it('should return error if question not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Question.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await getQuestionById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Question not found'
      });
    });
  });

  describe('updateQuestion', () => {
    const mockUpdateData = {
      title: 'Updated Question',
      type: 'multiple-choice',
      imageUrl: 'http://localhost:5000/uploads/new-image.jpg',
      options: [
        { text: 'New Option 1', color: 'green', isCorrect: true }
      ]
    };

    it('should update question successfully', async () => {
      // Setup
      req.params = { id: 'question123' };
      req.body = mockUpdateData;

      const mockQuestion = {
        _id: 'question123',
        ...mockUpdateData,
        save: jest.fn().mockResolvedValue(undefined)
      };

      Question.findById.mockResolvedValueOnce(mockQuestion)
        .mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue({
            ...mockQuestion,
            imageUrl: { path: 'uploads\\new-image.jpg' },
            toObject: jest.fn().mockReturnValue(mockQuestion)
          })
        });

      Media.findOne.mockResolvedValue({ _id: 'media123' });

      // Execute
      await updateQuestion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Question updated successfully',
        question: expect.objectContaining({
          title: mockUpdateData.title
        })
      }));
    });

    it('should return error if question not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      req.body = mockUpdateData;
      Question.findById.mockResolvedValue(null);

      // Execute
      await updateQuestion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Question not found'
      });
    });
  });

  describe('deleteQuestion', () => {
    it('should delete question successfully', async () => {
      // Setup
      req.params = { id: 'question123' };
      Question.findById.mockResolvedValue({ _id: 'question123' });
      Question.deleteOne.mockResolvedValue({ deletedCount: 1 });

      // Execute
      await deleteQuestion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Question deleted successfully'
      });
    });

    it('should return error if question not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Question.findById.mockResolvedValue(null);

      // Execute
      await deleteQuestion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Question not found'
      });
    });
  });
});