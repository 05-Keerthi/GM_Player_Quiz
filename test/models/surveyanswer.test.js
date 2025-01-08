const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SurveyAnswer = require('../../models/surveyanswer');

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

describe('Survey Answer Model Unit Tests', () => {
  afterEach(async () => {
    await SurveyAnswer.deleteMany({});
  });

  test('should create a SurveyAnswer with valid data', async () => {
    const surveyAnswerData = {
      surveyQuestion: new mongoose.Types.ObjectId(),
      surveyPlayers: new mongoose.Types.ObjectId(),
      surveySession: new mongoose.Types.ObjectId(),
      surveyAnswer: 'Yes',
      timeTaken: 15
    };

    const surveyAnswer = await SurveyAnswer.create(surveyAnswerData);

    expect(surveyAnswer._id).toBeDefined();
    expect(surveyAnswer.surveyQuestion.toString()).toBe(surveyAnswerData.surveyQuestion.toString());
    expect(surveyAnswer.surveyPlayers.toString()).toBe(surveyAnswerData.surveyPlayers.toString());
    expect(surveyAnswer.surveySession.toString()).toBe(surveyAnswerData.surveySession.toString());
    expect(surveyAnswer.surveyAnswer).toBe(surveyAnswerData.surveyAnswer);
    expect(surveyAnswer.timeTaken).toBe(surveyAnswerData.timeTaken);
    expect(surveyAnswer.createdAt).toBeDefined();
  });

  test('should require all mandatory fields', async () => {
    const invalidSurveyAnswerData = {
      surveyQuestion: new mongoose.Types.ObjectId(),
      // missing surveyPlayers
      surveySession: new mongoose.Types.ObjectId(),
      surveyAnswer: 'Test answer'
      // missing timeTaken
    };

    await expect(SurveyAnswer.create(invalidSurveyAnswerData))
      .rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should handle different types of survey answers', async () => {
    const testCases = [
      {
        surveyAnswer: 'Text answer',
        description: 'string answer'
      },
      {
        surveyAnswer: true,
        description: 'boolean answer'
      },
      {
        surveyAnswer: 42,
        description: 'number answer'
      },
      {
        surveyAnswer: ['Option 1', 'Option 2'],
        description: 'array answer'
      },
      {
        surveyAnswer: { key: 'value', nested: { data: 'test' } },
        description: 'object answer'
      }
    ];

    for (const testCase of testCases) {
      const surveyAnswerData = {
        surveyQuestion: new mongoose.Types.ObjectId(),
        surveyPlayers: new mongoose.Types.ObjectId(),
        surveySession: new mongoose.Types.ObjectId(),
        surveyAnswer: testCase.surveyAnswer,
        timeTaken: 10
      };

      const surveyAnswer = await SurveyAnswer.create(surveyAnswerData);
      expect(surveyAnswer.surveyAnswer).toEqual(testCase.surveyAnswer);
    }
  });

  test('should set createdAt automatically', async () => {
    const surveyAnswerData = {
      surveyQuestion: new mongoose.Types.ObjectId(),
      surveyPlayers: new mongoose.Types.ObjectId(),
      surveySession: new mongoose.Types.ObjectId(),
      surveyAnswer: 'Test answer',
      timeTaken: 8
    };

    const beforeCreate = new Date();
    const surveyAnswer = await SurveyAnswer.create(surveyAnswerData);
    const afterCreate = new Date();

    expect(surveyAnswer.createdAt).toBeDefined();
    expect(surveyAnswer.createdAt).toBeInstanceOf(Date);
    expect(surveyAnswer.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(surveyAnswer.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });

  test('should query answers by surveySession', async () => {
    const sessionId = new mongoose.Types.ObjectId();
    const surveyAnswerData1 = {
      surveyQuestion: new mongoose.Types.ObjectId(),
      surveyPlayers: new mongoose.Types.ObjectId(),
      surveySession: sessionId,
      surveyAnswer: 'Answer 1',
      timeTaken: 10
    };

    const surveyAnswerData2 = {
      surveyQuestion: new mongoose.Types.ObjectId(),
      surveyPlayers: new mongoose.Types.ObjectId(),
      surveySession: sessionId,
      surveyAnswer: 'Answer 2',
      timeTaken: 15
    };

    await SurveyAnswer.create(surveyAnswerData1);
    await SurveyAnswer.create(surveyAnswerData2);

    const sessionAnswers = await SurveyAnswer.find({ surveySession: sessionId });
    expect(sessionAnswers).toHaveLength(2);
    expect(sessionAnswers[0].surveySession.toString()).toBe(sessionId.toString());
    expect(sessionAnswers[1].surveySession.toString()).toBe(sessionId.toString());
  });

  test('should query answers by surveyPlayer', async () => {
    const playerId = new mongoose.Types.ObjectId();
    const surveyAnswerData1 = {
      surveyQuestion: new mongoose.Types.ObjectId(),
      surveyPlayers: playerId,
      surveySession: new mongoose.Types.ObjectId(),
      surveyAnswer: 'Player Answer 1',
      timeTaken: 12
    };

    const surveyAnswerData2 = {
      surveyQuestion: new mongoose.Types.ObjectId(),
      surveyPlayers: playerId,
      surveySession: new mongoose.Types.ObjectId(),
      surveyAnswer: 'Player Answer 2',
      timeTaken: 8
    };

    await SurveyAnswer.create(surveyAnswerData1);
    await SurveyAnswer.create(surveyAnswerData2);

    const playerAnswers = await SurveyAnswer.find({ surveyPlayers: playerId });
    expect(playerAnswers).toHaveLength(2);
    expect(playerAnswers[0].surveyPlayers.toString()).toBe(playerId.toString());
    expect(playerAnswers[1].surveyPlayers.toString()).toBe(playerId.toString());
  });

  test('should validate timeTaken is a number', async () => {
    const invalidSurveyAnswerData = {
      surveyQuestion: new mongoose.Types.ObjectId(),
      surveyPlayers: new mongoose.Types.ObjectId(),
      surveySession: new mongoose.Types.ObjectId(),
      surveyAnswer: 'Test answer',
      timeTaken: 'invalid' // Should be a number
    };

    await expect(SurveyAnswer.create(invalidSurveyAnswerData))
      .rejects.toThrow(mongoose.Error.ValidationError);
  });
});