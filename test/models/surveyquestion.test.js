const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SurveyQuestion = require('../../models/surveyQuestion');

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

describe('SurveyQuestion Model Unit Tests', () => {
  afterEach(async () => {
    await SurveyQuestion.deleteMany({});
  });

  test('should create a SurveyQuestion with valid data', async () => {
    const surveyQuestionData = {
      title: 'What is your favorite color?',
      description: 'Choose a color that best describes your mood.',
      dimension: 'Preference',
      year: '2025',
      surveyQuiz: new mongoose.Types.ObjectId(),
      timer: 60,
      answerOptions: [
        { optionText: 'Red', color: '#FF0000' },
        { optionText: 'Blue', color: '#0000FF' },
      ],
    };

    const surveyQuestion = await SurveyQuestion.create(surveyQuestionData);

    expect(surveyQuestion._id).toBeDefined();
    expect(surveyQuestion.title).toBe(surveyQuestionData.title);
    expect(surveyQuestion.description).toBe(surveyQuestionData.description);
    expect(surveyQuestion.dimension).toBe(surveyQuestionData.dimension);
    expect(surveyQuestion.year).toBe(surveyQuestionData.year);
    expect(surveyQuestion.surveyQuiz.toString()).toBe(surveyQuestionData.surveyQuiz.toString());
    expect(surveyQuestion.timer).toBe(surveyQuestionData.timer);
    expect(surveyQuestion.answerOptions).toHaveLength(2);
  });

  test('should require title, description, and surveyQuiz fields', async () => {
    const surveyQuestionData = {
      dimension: 'Demographics',
      year: '2023',
    };

    await expect(SurveyQuestion.create(surveyQuestionData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should set default values correctly', async () => {
    const surveyQuestionData = {
      title: 'Default value test',
      description: 'Testing default values for optional fields.',
      surveyQuiz: new mongoose.Types.ObjectId(),
      answerOptions: [{ optionText: 'Default Option' }],
    };

    const surveyQuestion = await SurveyQuestion.create(surveyQuestionData);
    expect(surveyQuestion.timer).toBe(30);
    expect(surveyQuestion.answerOptions[0].color).toBe('#FFFFFF');
  });

  test('should handle imageUrl as a reference', async () => {
    const surveyQuestionData = {
      title: 'Survey Question with Image',
      description: 'This question references an image.',
      surveyQuiz: new mongoose.Types.ObjectId(),
      imageUrl: new mongoose.Types.ObjectId(),
      answerOptions: [{ optionText: 'Option with image' }],
    };

    const surveyQuestion = await SurveyQuestion.create(surveyQuestionData);
    expect(surveyQuestion.imageUrl).toBeDefined();
    expect(mongoose.Types.ObjectId.isValid(surveyQuestion.imageUrl)).toBeTruthy();
  });

  test('should handle multiple answer options', async () => {
    const surveyQuestionData = {
      title: 'Multiple options test',
      description: 'This question allows multiple options.',
      surveyQuiz: new mongoose.Types.ObjectId(),
      answerOptions: [
        { optionText: 'Option 1', color: '#00FF00' },
        { optionText: 'Option 2', color: '#FF00FF' },
        { optionText: 'Option 3', color: '#0000FF' },
      ],
    };

    const surveyQuestion = await SurveyQuestion.create(surveyQuestionData);
    expect(surveyQuestion.answerOptions).toHaveLength(3);
    expect(surveyQuestion.answerOptions[0].optionText).toBe('Option 1');
    expect(surveyQuestion.answerOptions[1].color).toBe('#FF00FF');
  });

  test('should reject missing answer option text', async () => {
    const surveyQuestionData = {
      title: 'Invalid options test',
      description: 'This question has invalid options.',
      surveyQuiz: new mongoose.Types.ObjectId(),
      answerOptions: [
        { color: '#000000' }, // Missing optionText
      ],
    };

    await expect(SurveyQuestion.create(surveyQuestionData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should allow optional fields to be empty', async () => {
    const surveyQuestionData = {
      title: 'Minimal data test',
      description: 'Testing with only required fields.',
      surveyQuiz: new mongoose.Types.ObjectId(),
      answerOptions: [{ optionText: 'Minimal Option' }],
    };

    const surveyQuestion = await SurveyQuestion.create(surveyQuestionData);
    expect(surveyQuestion.dimension).toBeUndefined();
    expect(surveyQuestion.year).toBeUndefined();
    expect(surveyQuestion.imageUrl).toBeUndefined();
  });

  test('should update survey question properties', async () => {
    const surveyQuestionData = {
      title: 'Original Title',
      description: 'Original Description',
      surveyQuiz: new mongoose.Types.ObjectId(),
      answerOptions: [{ optionText: 'Original Option' }],
    };

    const surveyQuestion = await SurveyQuestion.create(surveyQuestionData);

    surveyQuestion.title = 'Updated Title';
    surveyQuestion.description = 'Updated Description';
    surveyQuestion.timer = 45;
    await surveyQuestion.save();

    const updatedSurveyQuestion = await SurveyQuestion.findById(surveyQuestion._id);
    expect(updatedSurveyQuestion.title).toBe('Updated Title');
    expect(updatedSurveyQuestion.description).toBe('Updated Description');
    expect(updatedSurveyQuestion.timer).toBe(45);
  });
});
