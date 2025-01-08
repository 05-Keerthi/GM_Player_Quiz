const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SurveyQuiz = require('../../models/surveyQuiz');

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

describe('SurveyQuiz Model Unit Tests', () => {
  afterEach(async () => {
    await SurveyQuiz.deleteMany({});
  });

  test('should create a SurveyQuiz with valid data', async () => {
    const surveyQuizData = {
      title: 'Customer Satisfaction Survey',
      description: 'Survey to gather customer feedback',
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
    };

    const surveyQuiz = await SurveyQuiz.create(surveyQuizData);

    expect(surveyQuiz._id).toBeDefined();
    expect(surveyQuiz.title).toBe(surveyQuizData.title);
    expect(surveyQuiz.description).toBe(surveyQuizData.description);
    expect(surveyQuiz.isPublic).toBe(surveyQuizData.isPublic);
    expect(surveyQuiz.categories).toHaveLength(1);
    expect(surveyQuiz.slides).toHaveLength(2);
    expect(surveyQuiz.questions).toHaveLength(2);
    expect(surveyQuiz.order).toHaveLength(2);
    expect(surveyQuiz.status).toBe(surveyQuizData.status);
    expect(surveyQuiz.createdAt).toBeDefined();
  });

  test('should allow empty categories array', async () => {
    const surveyQuizData = {
      title: 'Survey without categories',
      categories: [],
      status: 'draft',
    };

    const surveyQuiz = await SurveyQuiz.create(surveyQuizData);
    expect(surveyQuiz._id).toBeDefined();
    expect(surveyQuiz.categories).toHaveLength(0);
  });

  test('should only allow valid status values', async () => {
    const surveyQuizData = {
      categories: [new mongoose.Types.ObjectId()],
      status: 'invalid_status',
    };

    await expect(SurveyQuiz.create(surveyQuizData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should test all valid status types', async () => {
    const validStatuses = ['draft', 'active', 'closed'];
    const categoryId = new mongoose.Types.ObjectId();

    for (const status of validStatuses) {
      const surveyQuizData = {
        categories: [categoryId],
        status: status,
      };

      const surveyQuiz = await SurveyQuiz.create(surveyQuizData);
      expect(surveyQuiz.status).toBe(status);
    }
  });

  test('should set default values correctly', async () => {
    const surveyQuizData = {
      categories: [new mongoose.Types.ObjectId()],
    };

    const surveyQuiz = await SurveyQuiz.create(surveyQuizData);
    expect(surveyQuiz.isPublic).toBe(true);
    expect(surveyQuiz.status).toBe('draft');
  });

  test('should validate order array structure', async () => {
    const surveyQuizData = {
      categories: [new mongoose.Types.ObjectId()],
      order: [
        { id: new mongoose.Types.ObjectId(), type: 'invalid_type' },
      ],
    };

    await expect(SurveyQuiz.create(surveyQuizData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should handle adding and removing questions/slides', async () => {
    const surveyQuiz = await SurveyQuiz.create({
      categories: [new mongoose.Types.ObjectId()],
    });

    const questionId = new mongoose.Types.ObjectId();
    const slideId = new mongoose.Types.ObjectId();

    surveyQuiz.questions.push(questionId);
    surveyQuiz.slides.push(slideId);
    surveyQuiz.order.push(
      { id: questionId, type: 'question' },
      { id: slideId, type: 'slide' }
    );

    await surveyQuiz.save();

    expect(surveyQuiz.questions).toHaveLength(1);
    expect(surveyQuiz.slides).toHaveLength(1);
    expect(surveyQuiz.order).toHaveLength(2);
  });

  test('should set createdAt automatically', async () => {
    const surveyQuiz = await SurveyQuiz.create({
      categories: [],
    });

    expect(surveyQuiz.createdAt).toBeDefined();
    expect(surveyQuiz.createdAt).toBeInstanceOf(Date);
  });

  test('should allow title to be optional', async () => {
    const surveyQuizData = {
      categories: [],
      description: 'Survey without title',
    };

    const surveyQuiz = await SurveyQuiz.create(surveyQuizData);
    expect(surveyQuiz._id).toBeDefined();
    expect(surveyQuiz.title).toBeUndefined();
  });
});
