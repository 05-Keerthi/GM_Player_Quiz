const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SurveyNotification = require('../../models/SurveyNotification');

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

describe('Survey Notification Model Unit Tests', () => {
  afterEach(async () => {
    await SurveyNotification.deleteMany({});
  });

  test('should create a SurveyNotification with valid data', async () => {
    const notificationData = {
      user: new mongoose.Types.ObjectId(),
      message: 'You have been invited to a survey',
      type: 'Survey-Invitation',
      sessionId: new mongoose.Types.ObjectId()
    };

    const notification = await SurveyNotification.create(notificationData);

    expect(notification._id).toBeDefined();
    expect(notification.user.toString()).toBe(notificationData.user.toString());
    expect(notification.message).toBe(notificationData.message);
    expect(notification.type).toBe(notificationData.type);
    expect(notification.sessionId.toString()).toBe(notificationData.sessionId.toString());
    expect(notification.read).toBe(false);
    expect(notification.createdAt).toBeDefined();
  });

  test('should require mandatory fields', async () => {
    const invalidNotificationData = {
      message: 'Test notification',
      // missing user and type
      sessionId: new mongoose.Types.ObjectId()
    };

    await expect(SurveyNotification.create(invalidNotificationData))
      .rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should validate notification type enum values', async () => {
    const invalidNotificationData = {
      user: new mongoose.Types.ObjectId(),
      message: 'Test message',
      type: 'invalid_type', // Invalid type
      sessionId: new mongoose.Types.ObjectId()
    };

    await expect(SurveyNotification.create(invalidNotificationData))
      .rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should accept all valid notification types', async () => {
    const validTypes = ['Survey-Invitation', 'Survey-session_update', 'admin_notice'];

    for (const type of validTypes) {
      const notificationData = {
        user: new mongoose.Types.ObjectId(),
        message: 'Test notification',
        type: type,
        sessionId: new mongoose.Types.ObjectId()
      };

      const notification = await SurveyNotification.create(notificationData);
      expect(notification.type).toBe(type);
    }
  });

  test('should create notification with default read status', async () => {
    const notificationData = {
      user: new mongoose.Types.ObjectId(),
      message: 'Test notification',
      type: 'Survey-Invitation',
      sessionId: new mongoose.Types.ObjectId()
    };

    const notification = await SurveyNotification.create(notificationData);
    expect(notification.read).toBe(false);
  });

  test('should update notification read status', async () => {
    const notificationData = {
      user: new mongoose.Types.ObjectId(),
      message: 'Test notification',
      type: 'Survey-Invitation',
      sessionId: new mongoose.Types.ObjectId(),
      read: false
    };

    const notification = await SurveyNotification.create(notificationData);
    
    notification.read = true;
    await notification.save();

    const updatedNotification = await SurveyNotification.findById(notification._id);
    expect(updatedNotification.read).toBe(true);
  });

  test('should create notification without sessionId for admin notice', async () => {
    const notificationData = {
      user: new mongoose.Types.ObjectId(),
      message: 'System maintenance notification',
      type: 'admin_notice'
      // No sessionId for admin notice
    };

    const notification = await SurveyNotification.create(notificationData);
    expect(notification._id).toBeDefined();
    expect(notification.sessionId).toBeUndefined();
  });

  test('should set createdAt automatically', async () => {
    const notificationData = {
      user: new mongoose.Types.ObjectId(),
      message: 'Test notification',
      type: 'Survey-Invitation',
      sessionId: new mongoose.Types.ObjectId()
    };

    const beforeCreate = new Date();
    const notification = await SurveyNotification.create(notificationData);
    const afterCreate = new Date();

    expect(notification.createdAt).toBeDefined();
    expect(notification.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(notification.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });

  test('should find unread notifications for a user', async () => {
    const userId = new mongoose.Types.ObjectId();
    const notification1 = {
      user: userId,
      message: 'First notification',
      type: 'Survey-Invitation',
      read: false
    };

    const notification2 = {
      user: userId,
      message: 'Second notification',
      type: 'Survey-session_update',
      read: true
    };

    await SurveyNotification.create(notification1);
    await SurveyNotification.create(notification2);

    const unreadNotifications = await SurveyNotification.find({ 
      user: userId,
      read: false
    });

    expect(unreadNotifications).toHaveLength(1);
    expect(unreadNotifications[0].message).toBe('First notification');
  });

  test('should find notifications by session', async () => {
    const sessionId = new mongoose.Types.ObjectId();
    const notification1 = {
      user: new mongoose.Types.ObjectId(),
      message: 'Session notification 1',
      type: 'Survey-session_update',
      sessionId: sessionId
    };

    const notification2 = {
      user: new mongoose.Types.ObjectId(),
      message: 'Session notification 2',
      type: 'Survey-session_update',
      sessionId: sessionId
    };

    await SurveyNotification.create(notification1);
    await SurveyNotification.create(notification2);

    const sessionNotifications = await SurveyNotification.find({ sessionId });
    expect(sessionNotifications).toHaveLength(2);
    expect(sessionNotifications[0].sessionId.toString()).toBe(sessionId.toString());
    expect(sessionNotifications[1].sessionId.toString()).toBe(sessionId.toString());
  });
});