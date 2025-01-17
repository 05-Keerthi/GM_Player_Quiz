const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');

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

describe('User Model Unit Tests', () => {
  afterEach(async () => {
    await User.deleteMany({});
  });

  test('should create a regular user with valid data', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      mobile: '+1234567890',
      role: 'user'
    };

    const user = await User.create(userData);

    expect(user._id).toBeDefined();
    expect(user.username).toBe(userData.username);
    expect(user.email).toBe(userData.email);
    expect(user.mobile).toBe(userData.mobile);
    expect(user.role).toBe(userData.role);
    expect(user.isGuest).toBe(false);
    expect(await bcrypt.compare(userData.password, user.password)).toBe(true);
  });

  test('should create a guest user with valid data', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const userData = {
      username: 'guestuser',
      email: 'guest@example.com',
      mobile: '+9876543210',
      isGuest: true,
      guestExpiryDate: tomorrow
    };

    const user = await User.create(userData);

    expect(user.isGuest).toBe(true);
    expect(user.guestExpiryDate).toBeDefined();
    expect(user.password).toBeUndefined();
  });

  test('should require password for regular users', async () => {
    const userData = {
      username: 'nopassword',
      email: 'nopass@example.com',
      mobile: '+1122334455'
    };

    await expect(User.create(userData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should require guestExpiryDate for guest users', async () => {
    const userData = {
      username: 'guestnodeadline',
      email: 'guestnodeadline@example.com',
      mobile: '+5544332211',
      isGuest: true
    };

    await expect(User.create(userData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should validate role enum values', async () => {
    const userData = {
      username: 'invalidrole',
      email: 'invalid@example.com',
      password: 'password123',
      mobile: '+9988776655',
      role: 'invalid_role'
    };

    await expect(User.create(userData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should enforce unique username', async () => {
    const userData = {
      username: 'uniqueuser',
      email: 'unique1@example.com',
      password: 'password123',
      mobile: '+1111111111'
    };

    await User.create(userData);

    const duplicateUser = {
      ...userData,
      email: 'unique2@example.com',
      mobile: '+2222222222'
    };

    await expect(User.create(duplicateUser)).rejects.toThrow(mongoose.MongoError);
  });

  test('should enforce unique email', async () => {
    const userData = {
      username: 'emailuser1',
      email: 'same@example.com',
      password: 'password123',
      mobile: '+3333333333'
    };

    await User.create(userData);

    const duplicateUser = {
      ...userData,
      username: 'emailuser2',
      mobile: '+4444444444'
    };

    await expect(User.create(duplicateUser)).rejects.toThrow(mongoose.MongoError);
  });

  test('should hash password on save', async () => {
    const userData = {
      username: 'hashtest',
      email: 'hash@example.com',
      password: 'password123',
      mobile: '+5555555555'
    };

    const user = await User.create(userData);
    expect(user.password).not.toBe(userData.password);
    expect(await bcrypt.compare(userData.password, user.password)).toBe(true);
  });

  test('should check if guest account is expired', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const expiredUser = await User.create({
      username: 'expiredguest',
      email: 'expired@example.com',
      mobile: '+6666666666',
      isGuest: true,
      guestExpiryDate: yesterday
    });

    const activeUser = await User.create({
      username: 'activeguest',
      email: 'active@example.com',
      mobile: '+7777777777',
      isGuest: true,
      guestExpiryDate: tomorrow
    });

    expect(expiredUser.isGuestExpired()).toBe(true);
    expect(activeUser.isGuestExpired()).toBe(false);
  });

  test('should convert guest to regular user', async () => {
    const guestUser = await User.create({
      username: 'convertguest',
      email: 'convert@example.com',
      mobile: '+8888888888',
      isGuest: true,
      guestExpiryDate: new Date(Date.now() + 86400000)
    });

    await guestUser.convertToRegularUser('newpassword123');

    expect(guestUser.isGuest).toBe(false);
    expect(guestUser.guestExpiryDate).toBeUndefined();
    expect(guestUser.password).toBeDefined();
    expect(await bcrypt.compare('newpassword123', guestUser.password)).toBe(true);
  });

  test('should clean up expired guests', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await User.create([
      {
        username: 'expiredguest1',
        email: 'expired1@example.com',
        mobile: '+9999999991',
        isGuest: true,
        guestExpiryDate: yesterday
      },
      {
        username: 'activeguest1',
        email: 'active1@example.com',
        mobile: '+9999999992',
        isGuest: true,
        guestExpiryDate: tomorrow
      }
    ]);

    await User.cleanupExpiredGuests();
    const remainingUsers = await User.find({});
    expect(remainingUsers).toHaveLength(1);
    expect(remainingUsers[0].username).toBe('activeguest1');
  });

  test('should handle survey participations', async () => {
    const sessionId = new mongoose.Types.ObjectId();
    const userData = {
      username: 'participant',
      email: 'participant@example.com',
      password: 'password123',
      mobile: '+1010101010',
      surveyParticipations: [{
        sessionId: sessionId
      }]
    };

    const user = await User.create(userData);
    expect(user.surveyParticipations).toHaveLength(1);
    expect(user.surveyParticipations[0].sessionId.toString()).toBe(sessionId.toString());
    expect(user.surveyParticipations[0].joinedAt).toBeDefined();
  });

  test('should handle password reset fields', async () => {
    const userData = {
      username: 'resetuser',
      email: 'reset@example.com',
      password: 'password123',
      mobile: '+1212121212',
      resetPasswordCode: '123456',
      resetPasswordExpires: new Date(Date.now() + 3600000)
    };

    const user = await User.create(userData);
    expect(user.resetPasswordCode).toBe(userData.resetPasswordCode);
    expect(user.resetPasswordExpires).toBeDefined();
  });
});