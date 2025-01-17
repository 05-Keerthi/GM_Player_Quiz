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
    const categoryId = new mongoose.Types.ObjectId();
    const slideId = new mongoose.Types.ObjectId();
    const questionId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    const surveyQuizData = {
      title: 'Art Survey 2025',
      description: 'A comprehensive art survey',
      isPublic: true,
      type: 'ArtPulse',
      categories: [categoryId],
      slides: [slideId],
      questions: [questionId],
      order: [
        { id: slideId, type: 'slide' },
        { id: questionId, type: 'question' }
      ],
      createdBy: userId,
      status: 'draft'
    };

    const surveyQuiz = await SurveyQuiz.create(surveyQuizData);

    expect(surveyQuiz._id).toBeDefined();
    expect(surveyQuiz.title).toBe(surveyQuizData.title);
    expect(surveyQuiz.description).toBe(surveyQuizData.description);
    expect(surveyQuiz.isPublic).toBe(surveyQuizData.isPublic);
    expect(surveyQuiz.type).toBe(surveyQuizData.type);
    expect(surveyQuiz.categories[0].toString()).toBe(categoryId.toString());
    expect(surveyQuiz.slides[0].toString()).toBe(slideId.toString());
    expect(surveyQuiz.questions[0].toString()).toBe(questionId.toString());
    expect(surveyQuiz.order).toHaveLength(2);
    expect(surveyQuiz.createdBy.toString()).toBe(userId.toString());
    expect(surveyQuiz.status).toBe('draft');
    expect(surveyQuiz.createdAt).toBeDefined();
  });

  test('should handle empty categories array', async () => {
    const surveyQuizData = {
      title: 'Survey without categories',
      type: 'survey',
      categories: [],
      order: []
    };

    const surveyQuiz = await SurveyQuiz.create(surveyQuizData);
    expect(surveyQuiz.categories).toHaveLength(0);
    expect(surveyQuiz.type).toBe('survey');
    expect(surveyQuiz.title).toBe('Survey without categories');
  });

  test('should validate type enum values', async () => {
    const surveyQuizData = {
      title: 'Invalid Type Survey',
      type: 'invalid_type', // Invalid type
      categories: [new mongoose.Types.ObjectId()],
      order: []
    };

    await expect(SurveyQuiz.create(surveyQuizData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should validate status enum values', async () => {
    const surveyQuizData = {
      title: 'Invalid Status Survey',
      type: 'survey',
      categories: [new mongoose.Types.ObjectId()],
      status: 'invalid_status', // Invalid status
      order: []
    };

    await expect(SurveyQuiz.create(surveyQuizData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should set default values correctly', async () => {
    const surveyQuizData = {
      type: 'survey',
      categories: [new mongoose.Types.ObjectId()],
      order: []
    };

    const surveyQuiz = await SurveyQuiz.create(surveyQuizData);
    expect(surveyQuiz.isPublic).toBe(true);
    expect(surveyQuiz.status).toBe('draft');
    expect(surveyQuiz.createdAt).toBeDefined();
  });

  test('should validate order array structure', async () => {
    const questionId = new mongoose.Types.ObjectId();
    const surveyQuizData = {
      type: 'survey',
      categories: [new mongoose.Types.ObjectId()],
      order: [
        { id: questionId, type: 'invalid_type' } // Invalid order type
      ]
    };

    await expect(SurveyQuiz.create(surveyQuizData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should update survey quiz properties', async () => {
    const surveyQuiz = await SurveyQuiz.create({
      title: 'Original Title',
      type: 'survey',
      categories: [new mongoose.Types.ObjectId()],
      order: []
    });

    surveyQuiz.title = 'Updated Title';
    surveyQuiz.description = 'Updated Description';
    surveyQuiz.status = 'active';
    await surveyQuiz.save();

    const updatedSurveyQuiz = await SurveyQuiz.findById(surveyQuiz._id);
    expect(updatedSurveyQuiz.title).toBe('Updated Title');
    expect(updatedSurveyQuiz.description).toBe('Updated Description');
    expect(updatedSurveyQuiz.status).toBe('active');
  });

  test('should handle empty slides and questions arrays', async () => {
    const surveyQuizData = {
      title: 'Empty Arrays Test',
      type: 'survey',
      categories: [new mongoose.Types.ObjectId()],
      slides: [],
      questions: [],
      order: []
    };

    const surveyQuiz = await SurveyQuiz.create(surveyQuizData);
    expect(surveyQuiz.slides).toHaveLength(0);
    expect(surveyQuiz.questions).toHaveLength(0);
  });

  test('should handle multiple categories', async () => {
    const categoryIds = [
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId(),
      new mongoose.Types.ObjectId()
    ];

    const surveyQuizData = {
      title: 'Multiple Categories Test',
      type: 'survey',
      categories: categoryIds,
      order: []
    };

    const surveyQuiz = await SurveyQuiz.create(surveyQuizData);
    expect(surveyQuiz.categories).toHaveLength(3);
    expect(surveyQuiz.categories.map(id => id.toString())).toEqual(
      expect.arrayContaining(categoryIds.map(id => id.toString()))
    );
  });
});