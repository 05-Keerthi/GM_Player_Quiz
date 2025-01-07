const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const BlacklistedToken = require('../../models/BlacklistedToken'); 

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

describe('BlacklistedToken Model Unit Tests', () => {
  afterEach(async () => {
    await BlacklistedToken.deleteMany({});
  });

  test('should create a BlacklistedToken with valid data', async () => {
    const tokenData = { token: 'sample.jwt.token' };
    const token = await BlacklistedToken.create(tokenData);

    expect(token._id).toBeDefined();
    expect(token.token).toBe(tokenData.token);
    expect(token.createdAt).toBeDefined();
  });

  test('should not allow duplicate tokens', async () => {
    const tokenData = { token: 'sample.jwt.token' };
    await BlacklistedToken.create(tokenData);

    await expect(BlacklistedToken.create(tokenData)).rejects.toThrow('duplicate key error');
  });

  test('should expire tokens after 24 hours', async () => {
    const tokenData = { token: 'sample.jwt.token' };
    const token = await BlacklistedToken.create(tokenData);

    expect(token.createdAt).toBeDefined();

    const expirationTimeInSeconds = 24 * 60 * 60;
    expect(token.schema.paths.createdAt.options.expires).toBe(expirationTimeInSeconds);
  });

  test('should require a token field', async () => {
    const tokenData = {};

    await expect(BlacklistedToken.create(tokenData)).rejects.toThrow(mongoose.Error.ValidationError);
  });
});
