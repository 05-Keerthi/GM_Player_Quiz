const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const RefreshToken = require('../../models/RefreshToken');

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

describe('RefreshToken Model Unit Tests', () => {
  afterEach(async () => {
    await RefreshToken.deleteMany({});
  });

  test('should create a RefreshToken with valid data', async () => {
    const tokenData = {
      token: 'valid.refresh.token',
      userId: new mongoose.Types.ObjectId()
    };

    const refreshToken = await RefreshToken.create(tokenData);

    expect(refreshToken._id).toBeDefined();
    expect(refreshToken.token).toBe(tokenData.token);
    expect(refreshToken.userId.toString()).toBe(tokenData.userId.toString());
    expect(refreshToken.createdAt).toBeDefined();
  });

  test('should require token field', async () => {
    const tokenData = {
      userId: new mongoose.Types.ObjectId()
    };

    await expect(RefreshToken.create(tokenData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should require userId field', async () => {
    const tokenData = {
      token: 'valid.refresh.token'
    };

    await expect(RefreshToken.create(tokenData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should set createdAt automatically', async () => {
    const tokenData = {
      token: 'valid.refresh.token',
      userId: new mongoose.Types.ObjectId()
    };

    const refreshToken = await RefreshToken.create(tokenData);
    
    expect(refreshToken.createdAt).toBeDefined();
    expect(refreshToken.createdAt).toBeInstanceOf(Date);
  });

  test('should find token by userId', async () => {
    const userId = new mongoose.Types.ObjectId();
    const tokenData = {
      token: 'valid.refresh.token',
      userId: userId
    };

    await RefreshToken.create(tokenData);

    const foundToken = await RefreshToken.findOne({ userId });
    expect(foundToken).toBeDefined();
    expect(foundToken.userId.toString()).toBe(userId.toString());
  });

  test('should update refresh token', async () => {
    const tokenData = {
      token: 'old.refresh.token',
      userId: new mongoose.Types.ObjectId()
    };

    const refreshToken = await RefreshToken.create(tokenData);
    
    const newTokenValue = 'new.refresh.token';
    refreshToken.token = newTokenValue;
    await refreshToken.save();

    const updatedToken = await RefreshToken.findById(refreshToken._id);
    expect(updatedToken.token).toBe(newTokenValue);
  });

  test('should delete refresh token', async () => {
    const tokenData = {
      token: 'valid.refresh.token',
      userId: new mongoose.Types.ObjectId()
    };

    const refreshToken = await RefreshToken.create(tokenData);
    const tokenId = refreshToken._id;

    await RefreshToken.findByIdAndDelete(tokenId);
    const deletedToken = await RefreshToken.findById(tokenId);
    expect(deletedToken).toBeNull();
  });

  test('should allow multiple tokens for same userId', async () => {
    const userId = new mongoose.Types.ObjectId();
    const tokenData1 = {
      token: 'token1.refresh.value',
      userId: userId
    };
    const tokenData2 = {
      token: 'token2.refresh.value',
      userId: userId
    };

    await RefreshToken.create(tokenData1);
    await RefreshToken.create(tokenData2);

    const userTokens = await RefreshToken.find({ userId });
    expect(userTokens).toHaveLength(2);
  });

  test('should validate userId is a valid ObjectId', async () => {
    const tokenData = {
      token: 'valid.refresh.token',
      userId: 'invalid-user-id'
    };

    await expect(RefreshToken.create(tokenData)).rejects.toThrow();
  });
});