const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Notification = require('../../models/Notification');

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

describe('Notification Model Unit Tests', () => {
  afterEach(async () => {
    await Notification.deleteMany({});
  });

  test('should create a Notification with valid data', async () => {
    const notificationData = {
      user: new mongoose.Types.ObjectId(),
      message: 'You have been invited to a quiz session',
      type: 'invitation',
      sessionId: new mongoose.Types.ObjectId(),
      read: false
    };

    const notification = await Notification.create(notificationData);

    expect(notification._id).toBeDefined();
    expect(notification.user.toString()).toBe(notificationData.user.toString());
    expect(notification.message).toBe(notificationData.message);
    expect(notification.type).toBe(notificationData.type);
    expect(notification.sessionId.toString()).toBe(notificationData.sessionId.toString());
    expect(notification.read).toBe(false);
    expect(notification.createdAt).toBeDefined();
  });

  test('should require user and message fields', async () => {
    const notificationData = {
      type: 'quiz_result',
      sessionId: new mongoose.Types.ObjectId()
    };

    await expect(Notification.create(notificationData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should only allow valid notification types', async () => {
    const notificationData = {
      user: new mongoose.Types.ObjectId(),
      message: 'Test notification',
      type: 'invalid_type',
      sessionId: new mongoose.Types.ObjectId()
    };

    await expect(Notification.create(notificationData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should test all valid notification types', async () => {
    const validTypes = ['invitation', 'session_update', 'quiz_result', 'admin_notice'];
    const userId = new mongoose.Types.ObjectId();

    for (const type of validTypes) {
      const notificationData = {
        user: userId,
        message: `Test ${type} notification`,
        type: type
      };

      const notification = await Notification.create(notificationData);
      expect(notification.type).toBe(type);
    }
  });

  test('should set default read status to false', async () => {
    const notificationData = {
      user: new mongoose.Types.ObjectId(),
      message: 'Test notification',
      type: 'admin_notice'
    };

    const notification = await Notification.create(notificationData);
    expect(notification.read).toBe(false);
  });

  test('should allow updating read status', async () => {
    const notificationData = {
      user: new mongoose.Types.ObjectId(),
      message: 'Test notification',
      type: 'quiz_result',
      sessionId: new mongoose.Types.ObjectId()
    };

    const notification = await Notification.create(notificationData);
    notification.read = true;
    await notification.save();

    const updatedNotification = await Notification.findById(notification._id);
    expect(updatedNotification.read).toBe(true);
  });

  test('should set createdAt automatically', async () => {
    const notificationData = {
      user: new mongoose.Types.ObjectId(),
      message: 'Test notification',
      type: 'session_update',
      sessionId: new mongoose.Types.ObjectId()
    };

    const notification = await Notification.create(notificationData);
    expect(notification.createdAt).toBeDefined();
    expect(notification.createdAt).toBeInstanceOf(Date);
  });

  test('should allow sessionId to be optional', async () => {
    const notificationData = {
      user: new mongoose.Types.ObjectId(),
      message: 'Test admin notice',
      type: 'admin_notice'
    };

    const notification = await Notification.create(notificationData);
    expect(notification._id).toBeDefined();
    expect(notification.sessionId).toBeUndefined();
  });

  test('should find notifications by user', async () => {
    const userId = new mongoose.Types.ObjectId();
    const notificationData = {
      user: userId,
      message: 'Test notification',
      type: 'invitation'
    };

    await Notification.create(notificationData);
    const notifications = await Notification.find({ user: userId });
    
    expect(notifications).toHaveLength(1);
    expect(notifications[0].user.toString()).toBe(userId.toString());
  });
});