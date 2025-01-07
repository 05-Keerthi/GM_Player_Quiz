const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Answer = require('../../models/answer'); 

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

describe('Answer Model Unit Tests', () => {
  afterEach(async () => {
    await Answer.deleteMany({});
  });

  test('should create an Answer with valid data', async () => {
    const answerData = {
      question: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      session: new mongoose.Types.ObjectId(),
      answerType: 'option',
      answer: 'A',
      isCorrect: true,
      timeTaken: 15,
    };

    const answer = await Answer.create(answerData);

    expect(answer._id).toBeDefined();
    expect(answer.answerType).toBe(answerData.answerType);
    expect(answer.answer).toBe(answerData.answer);
    expect(answer.isCorrect).toBe(true);
    expect(answer.timeTaken).toBe(15);
    expect(answer.createdAt).toBeDefined();
  });

  test('should require all required fields', async () => {
    const answerData = {
      answerType: 'text',
      answer: 'Sample Answer',
      timeTaken: 10,
    };

    await expect(Answer.create(answerData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should only allow valid answerType values', async () => {
    const answerData = {
      question: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      session: new mongoose.Types.ObjectId(),
      answerType: 'invalid_type',
      answer: 'Some Answer',
      timeTaken: 12,
    };

    await expect(Answer.create(answerData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should set createdAt automatically', async () => {
    const answerData = {
      question: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      session: new mongoose.Types.ObjectId(),
      answerType: 'boolean',
      answer: true,
      timeTaken: 8,
    };

    const answer = await Answer.create(answerData);

    expect(answer.createdAt).toBeDefined();
    expect(answer.createdAt).toBeInstanceOf(Date);
  });

  test('should store mixed answer values correctly', async () => {
    const answerData = {
      question: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      session: new mongoose.Types.ObjectId(),
      answerType: 'text',
      answer: { text: 'Sample Answer', language: 'English' },
      timeTaken: 20,
    };

    const answer = await Answer.create(answerData);

    expect(answer.answer.text).toBe('Sample Answer');
    expect(answer.answer.language).toBe('English');
  });
});
