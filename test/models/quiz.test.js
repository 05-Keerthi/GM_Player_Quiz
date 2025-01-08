const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Quiz = require('../../models/quiz');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Quiz Model Unit Tests', () => {
  afterEach(async () => {
    await Quiz.deleteMany({});
  });

  test('should create a Quiz with valid data', async () => {
    const quizData = {
      title: 'Math Quiz',
      description: 'Basic mathematics quiz',
      isPublic: true,
      categories: [new mongoose.Types.ObjectId()],
      slides: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      questions: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      order: [
        { id: new mongoose.Types.ObjectId(), type: 'slide' },
        { id: new mongoose.Types.ObjectId(), type: 'question' }
      ],
      createdBy: new mongoose.Types.ObjectId(),
      status: 'draft',
      duration: 60
    };

    const quiz = await Quiz.create(quizData);

    expect(quiz._id).toBeDefined();
    expect(quiz.title).toBe(quizData.title);
    expect(quiz.description).toBe(quizData.description);
    expect(quiz.isPublic).toBe(quizData.isPublic);
    expect(quiz.categories).toHaveLength(1);
    expect(quiz.slides).toHaveLength(2);
    expect(quiz.questions).toHaveLength(2);
    expect(quiz.order).toHaveLength(2);
    expect(quiz.status).toBe(quizData.status);
    expect(quiz.duration).toBe(quizData.duration);
    expect(quiz.createdAt).toBeDefined();
  });

  test('should allow empty categories array', async () => {
    const quizData = {
      title: 'Quiz without categories',
      categories: [],
      status: 'draft'
    };

    const quiz = await Quiz.create(quizData);
    expect(quiz._id).toBeDefined();
    expect(quiz.categories).toHaveLength(0);
  });

  test('should only allow valid status values', async () => {
    const quizData = {
      categories: [new mongoose.Types.ObjectId()],
      status: 'invalid_status'
    };

    await expect(Quiz.create(quizData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should test all valid status types', async () => {
    const validStatuses = ['draft', 'active', 'closed'];
    const categoryId = new mongoose.Types.ObjectId();

    for (const status of validStatuses) {
      const quizData = {
        categories: [categoryId],
        status: status
      };

      const quiz = await Quiz.create(quizData);
      expect(quiz.status).toBe(status);
    }
  });

  test('should set default values correctly', async () => {
    const quizData = {
      categories: [new mongoose.Types.ObjectId()]
    };

    const quiz = await Quiz.create(quizData);
    expect(quiz.isPublic).toBe(true);
    expect(quiz.status).toBe('draft');
    expect(quiz.duration).toBe(60);
  });

  test('should validate order array structure', async () => {
    const quizData = {
      categories: [new mongoose.Types.ObjectId()],
      order: [
        { id: new mongoose.Types.ObjectId(), type: 'invalid_type' }
      ]
    };

    await expect(Quiz.create(quizData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should handle tenant association', async () => {
    const quizData = {
      categories: [new mongoose.Types.ObjectId()],
      tenantId: new mongoose.Types.ObjectId()
    };

    const quiz = await Quiz.create(quizData);
    expect(quiz.tenantId).toBeDefined();
    expect(mongoose.Types.ObjectId.isValid(quiz.tenantId)).toBeTruthy();
  });

  test('should update quiz properties', async () => {
    const quizData = {
      title: 'Original Title',
      categories: [new mongoose.Types.ObjectId()],
      duration: 60
    };

    const quiz = await Quiz.create(quizData);
    
    const updatedTitle = 'Updated Title';
    const updatedDuration = 90;
    
    quiz.title = updatedTitle;
    quiz.duration = updatedDuration;
    await quiz.save();

    const updatedQuiz = await Quiz.findById(quiz._id);
    expect(updatedQuiz.title).toBe(updatedTitle);
    expect(updatedQuiz.duration).toBe(updatedDuration);
  });

  test('should handle adding and removing questions/slides', async () => {
    const quiz = await Quiz.create({
      categories: [new mongoose.Types.ObjectId()]
    });

    const questionId = new mongoose.Types.ObjectId();
    const slideId = new mongoose.Types.ObjectId();

    quiz.questions.push(questionId);
    quiz.slides.push(slideId);
    quiz.order.push(
      { id: questionId, type: 'question' },
      { id: slideId, type: 'slide' }
    );

    await quiz.save();

    expect(quiz.questions).toHaveLength(1);
    expect(quiz.slides).toHaveLength(1);
    expect(quiz.order).toHaveLength(2);
  });

  test('should set createdAt automatically', async () => {
    const quiz = await Quiz.create({
      categories: []
    });

    expect(quiz.createdAt).toBeDefined();
    expect(quiz.createdAt).toBeInstanceOf(Date);
  });

  test('should allow title to be optional', async () => {
    const quizData = {
      categories: [],
      description: 'Quiz without title'
    };

    const quiz = await Quiz.create(quizData);
    expect(quiz._id).toBeDefined();
    expect(quiz.title).toBeUndefined();
  });
});