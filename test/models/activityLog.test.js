const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ActivityLog = require('../../models/ActivityLog');

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

describe('ActivityLog Model Unit Tests', () => {
  afterEach(async () => {
    await ActivityLog.deleteMany({});
  });

  test('should create an ActivityLog with valid data', async () => {
    const logData = {
      user: new mongoose.Types.ObjectId(),
      activityType: 'login',
      details: { ip: '127.0.0.1', location: 'India' },
    };

    const activityLog = await ActivityLog.create(logData);

    expect(activityLog._id).toBeDefined();
    expect(activityLog.activityType).toBe(logData.activityType);
    expect(activityLog.details.get('ip')).toBe('127.0.0.1');
  });

  test('should require user and activityType fields', async () => {
    const logData = {
      details: { ip: '127.0.0.1', location: 'India' },
    };

    await expect(ActivityLog.create(logData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should only allow valid activityType values', async () => {
    const logData = {
      user: new mongoose.Types.ObjectId(),
      activityType: 'invalid_type',
      details: { ip: '127.0.0.1' },
    };

    await expect(ActivityLog.create(logData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should set createdAt automatically', async () => {
    const logData = {
      user: new mongoose.Types.ObjectId(),
      activityType: 'quiz_create',
      details: { quizId: '1234' },
    };

    const activityLog = await ActivityLog.create(logData);

    expect(activityLog.createdAt).toBeDefined();
    expect(activityLog.createdAt).toBeInstanceOf(Date);
  });

  test('should store details as a Map', async () => {
    const logData = {
      user: new mongoose.Types.ObjectId(),
      activityType: 'quiz_play',
      details: { score: '85', duration: '10m' },
    };

    const activityLog = await ActivityLog.create(logData);

    expect(activityLog.details instanceof Map).toBe(true);
    expect(activityLog.details.get('score')).toBe('85');
  });
});
