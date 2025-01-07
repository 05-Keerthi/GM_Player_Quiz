const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User'); // Adjust the path if needed
const bcrypt = require('bcryptjs');

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

  test('should create a user with valid data', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      mobile: '1234567890',
    };

    const user = await User.create(userData);
    expect(user._id).toBeDefined();
    expect(user.username).toBe(userData.username);
    expect(user.email).toBe(userData.email);
    expect(user.role).toBe('user'); // default value
  });

  test('should not allow duplicate email', async () => {
    const userData = {
      username: 'testuser1',
      email: 'duplicate@example.com',
      password: 'password123',
      mobile: '1234567890',
    };

    await User.create(userData);

    await expect(User.create(userData)).rejects.toThrow();
  });

  test('should hash the password before saving', async () => {
    const userData = {
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'mypassword',
      mobile: '1234567891',
    };

    const user = await User.create(userData);
    const isPasswordHashed = await bcrypt.compare('mypassword', user.password);

    expect(isPasswordHashed).toBe(true);
  });

  test('should set createdAt field automatically', async () => {
    const userData = {
      username: 'testuser3',
      email: 'test3@example.com',
      password: 'password123',
      mobile: '1234567892',
    };

    const user = await User.create(userData);

    expect(user.createdAt).toBeDefined();
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  test('should allow tenantId to be optional', async () => {
    const userData = {
      username: 'testuser4',
      email: 'test4@example.com',
      password: 'password123',
      mobile: '1234567893',
    };

    const user = await User.create(userData);

    expect(user.tenantId).toBeUndefined();
  });
});
