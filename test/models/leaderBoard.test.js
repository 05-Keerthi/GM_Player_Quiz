const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Leaderboard = require('../../models/leaderBoard');

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

describe('Leaderboard Model Unit Tests', () => {
  afterEach(async () => {
    await Leaderboard.deleteMany({});
  });

  test('should create a Leaderboard entry with valid data', async () => {
    const leaderboardData = {
      session: new mongoose.Types.ObjectId(),
      player: new mongoose.Types.ObjectId(),
      score: 100,
      rank: 1
    };

    const leaderboard = await Leaderboard.create(leaderboardData);

    expect(leaderboard._id).toBeDefined();
    expect(leaderboard.session.toString()).toBe(leaderboardData.session.toString());
    expect(leaderboard.player.toString()).toBe(leaderboardData.player.toString());
    expect(leaderboard.score).toBe(leaderboardData.score);
    expect(leaderboard.rank).toBe(leaderboardData.rank);
    expect(leaderboard.createdAt).toBeDefined();
  });

  test('should require session and player fields', async () => {
    const leaderboardData = {
      score: 100,
      rank: 1
    };

    await expect(Leaderboard.create(leaderboardData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should set default score to 0 if not provided', async () => {
    const leaderboardData = {
      session: new mongoose.Types.ObjectId(),
      player: new mongoose.Types.ObjectId(),
      rank: 1
    };

    const leaderboard = await Leaderboard.create(leaderboardData);

    expect(leaderboard.score).toBe(0);
  });

  test('should allow rank to be optional', async () => {
    const leaderboardData = {
      session: new mongoose.Types.ObjectId(),
      player: new mongoose.Types.ObjectId(),
      score: 50
    };

    const leaderboard = await Leaderboard.create(leaderboardData);

    expect(leaderboard._id).toBeDefined();
    expect(leaderboard.rank).toBeUndefined();
  });

  test('should set createdAt automatically', async () => {
    const leaderboardData = {
      session: new mongoose.Types.ObjectId(),
      player: new mongoose.Types.ObjectId(),
      score: 75,
      rank: 2
    };

    const leaderboard = await Leaderboard.create(leaderboardData);

    expect(leaderboard.createdAt).toBeDefined();
    expect(leaderboard.createdAt).toBeInstanceOf(Date);
  });

  test('should successfully update score and rank', async () => {
    const leaderboardData = {
      session: new mongoose.Types.ObjectId(),
      player: new mongoose.Types.ObjectId(),
      score: 100,
      rank: 3
    };

    const leaderboard = await Leaderboard.create(leaderboardData);
    
    const updatedScore = 150;
    const updatedRank = 1;
    
    leaderboard.score = updatedScore;
    leaderboard.rank = updatedRank;
    await leaderboard.save();

    const updatedLeaderboard = await Leaderboard.findById(leaderboard._id);
    expect(updatedLeaderboard.score).toBe(updatedScore);
    expect(updatedLeaderboard.rank).toBe(updatedRank);
  });

  test('should accept valid ObjectId references', async () => {
    const sessionId = new mongoose.Types.ObjectId();
    const playerId = new mongoose.Types.ObjectId();
    
    const leaderboardData = {
      session: sessionId,
      player: playerId,
      score: 200,
      rank: 1
    };

    const leaderboard = await Leaderboard.create(leaderboardData);
    
    expect(mongoose.Types.ObjectId.isValid(leaderboard.session)).toBeTruthy();
    expect(mongoose.Types.ObjectId.isValid(leaderboard.player)).toBeTruthy();
  });
});