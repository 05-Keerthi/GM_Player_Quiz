const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Session = require('../../models/session');
const { Types: { ObjectId } } = mongoose;

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

describe('Session Model Unit Tests', () => {
  afterEach(async () => {
    await Session.deleteMany({});
  });

  test('should create a Session with valid data', async () => {
    const sessionData = {
      quiz: new ObjectId(),
      host: new ObjectId(),
      joinCode: 'ABC123',
      qrData: 'qr-data-string',
      status: 'waiting',
      players: [new ObjectId(), new ObjectId()],
      questions: [new ObjectId(), new ObjectId()],
      currentQuestion: new ObjectId(),
      startTime: new Date(),
      endTime: new Date()
    };

    const session = await Session.create(sessionData);

    expect(session._id).toBeDefined();
    expect(session.quiz.toString()).toBe(sessionData.quiz.toString());
    expect(session.host.toString()).toBe(sessionData.host.toString());
    expect(session.joinCode).toBe(sessionData.joinCode);
    expect(session.qrData).toBe(sessionData.qrData);
    expect(session.status).toBe(sessionData.status);
    expect(session.players).toHaveLength(2);
    expect(session.questions).toHaveLength(2);
    expect(session.currentQuestion.toString()).toBe(sessionData.currentQuestion.toString());
    expect(session.startTime).toBeDefined();
    expect(session.endTime).toBeDefined();
    expect(session.createdAt).toBeDefined();
  });

  test('should require mandatory fields', async () => {
    const invalidSessionData = {
      // Missing quiz and host
      joinCode: 'ABC123',
      status: 'waiting'
    };

    await expect(Session.create(invalidSessionData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should validate status enum values', async () => {
    const invalidSessionData = {
      quiz: new ObjectId(),
      host: new ObjectId(),
      joinCode: 'ABC123',
      status: 'invalid_status' // Invalid status
    };

    await expect(Session.create(invalidSessionData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should create session with default status', async () => {
    const sessionData = {
      quiz: new ObjectId(),
      host: new ObjectId(),
      joinCode: 'ABC123'
    };

    const session = await Session.create(sessionData);

    expect(session.status).toBe('waiting');
  });

  test('should successfully update session status', async () => {
    const sessionData = {
      quiz: new ObjectId(),
      host: new ObjectId(),
      joinCode: 'ABC123'
    };

    const session = await Session.create(sessionData);
    
    session.status = 'in_progress';
    await session.save();

    const updatedSession = await Session.findById(session._id);
    expect(updatedSession.status).toBe('in_progress');
  });

  test('should add and remove players', async () => {
    const sessionData = {
      quiz: new ObjectId(),
      host: new ObjectId(),
      joinCode: 'ABC123',
      players: [new ObjectId()]
    };

    const session = await Session.create(sessionData);
    const newPlayer = new ObjectId();
    
    // Add player
    session.players.push(newPlayer);
    await session.save();
    
    let updatedSession = await Session.findById(session._id);
    expect(updatedSession.players).toHaveLength(2);
    expect(updatedSession.players[1].toString()).toBe(newPlayer.toString());

    // Remove player
    session.players.pull(newPlayer);
    await session.save();
    
    updatedSession = await Session.findById(session._id);
    expect(updatedSession.players).toHaveLength(1);
    expect(updatedSession.players.map(p => p.toString())).not.toContain(newPlayer.toString());
  });

  test('should update current question', async () => {
    const sessionData = {
      quiz: new ObjectId(),
      host: new ObjectId(),
      joinCode: 'ABC123',
      questions: [new ObjectId(), new ObjectId(), new ObjectId()]
    };

    const session = await Session.create(sessionData);
    const newCurrentQuestion = sessionData.questions[1];
    
    session.currentQuestion = newCurrentQuestion;
    await session.save();

    const updatedSession = await Session.findById(session._id);
    expect(updatedSession.currentQuestion.toString()).toBe(newCurrentQuestion.toString());
  });

  test('should track session timing', async () => {
    const sessionData = {
      quiz: new ObjectId(),
      host: new ObjectId(),
      joinCode: 'ABC123'
    };

    const session = await Session.create(sessionData);
    
    const startTime = new Date();
    session.startTime = startTime;
    await session.save();

    const endTime = new Date();
    session.endTime = endTime;
    await session.save();

    const updatedSession = await Session.findById(session._id);
    expect(updatedSession.startTime.getTime()).toBe(startTime.getTime());
    expect(updatedSession.endTime.getTime()).toBe(endTime.getTime());
  });

  test('should find sessions by host', async () => {
    const hostId = new ObjectId();
    const sessionData1 = {
      quiz: new ObjectId(),
      host: hostId,
      joinCode: 'ABC123'
    };

    const sessionData2 = {
      quiz: new ObjectId(),
      host: hostId,
      joinCode: 'DEF456'
    };

    await Session.create(sessionData1);
    await Session.create(sessionData2);

    const hostSessions = await Session.find({ host: hostId });
    expect(hostSessions).toHaveLength(2);
    expect(hostSessions[0].host.toString()).toBe(hostId.toString());
    expect(hostSessions[1].host.toString()).toBe(hostId.toString());
  });

  test('should find session by join code', async () => {
    const joinCode = 'UNIQUE123';
    const sessionData = {
      quiz: new ObjectId(),
      host: new ObjectId(),
      joinCode
    };

    await Session.create(sessionData);

    const session = await Session.findOne({ joinCode });
    expect(session).toBeDefined();
    expect(session.joinCode).toBe(joinCode);
  });
});