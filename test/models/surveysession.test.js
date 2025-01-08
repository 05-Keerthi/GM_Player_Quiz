const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SurveySession = require('../../models/surveysession'); 

// Create mock models for testing
const userSchema = new mongoose.Schema({
  name: String,
  email: String
});
const User = mongoose.model('User', userSchema);

const surveyQuizSchema = new mongoose.Schema({
  title: String,
  description: String
});
const SurveyQuiz = mongoose.model('SurveyQuiz', surveyQuizSchema);

const surveyQuestionSchema = new mongoose.Schema({
  question: String,
  answers: [String]
});
const SurveyQuestion = mongoose.model('SurveyQuestion', surveyQuestionSchema);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await SurveySession.deleteMany({});
  await User.deleteMany({});
  await SurveyQuiz.deleteMany({});
  await SurveyQuestion.deleteMany({});
});

describe('SurveySession Model Test Suite', () => {
  describe('Validation Tests', () => {
    test('should validate a valid survey session', async () => {
      const surveyQuiz = await SurveyQuiz.create({
        title: 'Test Quiz',
        description: 'Test Description'
      });
      
      const host = await User.create({
        name: 'Test Host',
        email: 'host@test.com'
      });

      const validSession = {
        surveyQuiz: surveyQuiz._id,
        surveyHost: host._id,
        surveyJoinCode: 'TEST123',
        surveyQrData: 'qr-data-test',
        surveyStatus: 'waiting'
      };

      const session = new SurveySession(validSession);
      const savedSession = await session.save();
      
      expect(savedSession._id).toBeDefined();
      expect(savedSession.surveyQuiz.toString()).toBe(surveyQuiz._id.toString());
      expect(savedSession.surveyHost.toString()).toBe(host._id.toString());
      expect(savedSession.surveyJoinCode).toBe('TEST123');
      expect(savedSession.surveyStatus).toBe('waiting');
      expect(savedSession.createdAt).toBeDefined();
    });

    test('should fail validation when required fields are missing', async () => {
      const sessionWithoutRequired = new SurveySession({
        surveyJoinCode: 'TEST123'
      });

      let err;
      try {
        await sessionWithoutRequired.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.surveyQuiz).toBeDefined();
      expect(err.errors.surveyHost).toBeDefined();
    });

    test('should enforce enum values for surveyStatus', async () => {
      const surveyQuiz = await SurveyQuiz.create({ title: 'Test Quiz' });
      const host = await User.create({ name: 'Test Host' });

      const sessionWithInvalidStatus = new SurveySession({
        surveyQuiz: surveyQuiz._id,
        surveyHost: host._id,
        surveyJoinCode: 'TEST123',
        surveyStatus: 'invalid_status'
      });

      let err;
      try {
        await sessionWithInvalidStatus.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.surveyStatus).toBeDefined();
    });
  });

  describe('Reference and Array Tests', () => {
    test('should handle players array correctly', async () => {
      const surveyQuiz = await SurveyQuiz.create({ title: 'Test Quiz' });
      const host = await User.create({ name: 'Host' });
      const player1 = await User.create({ name: 'Player 1' });
      const player2 = await User.create({ name: 'Player 2' });

      const session = await SurveySession.create({
        surveyQuiz: surveyQuiz._id,
        surveyHost: host._id,
        surveyJoinCode: 'TEST123',
        surveyPlayers: [player1._id, player2._id]
      });

      const populatedSession = await SurveySession.findById(session._id)
        .populate('surveyPlayers');

      expect(populatedSession.surveyPlayers).toHaveLength(2);
      expect(populatedSession.surveyPlayers[0].name).toBe('Player 1');
      expect(populatedSession.surveyPlayers[1].name).toBe('Player 2');
    });

    test('should handle questions array and current question', async () => {
      const surveyQuiz = await SurveyQuiz.create({ title: 'Test Quiz' });
      const host = await User.create({ name: 'Host' });
      const question1 = await SurveyQuestion.create({
        question: 'Q1',
        answers: ['A1', 'A2']
      });
      const question2 = await SurveyQuestion.create({
        question: 'Q2',
        answers: ['B1', 'B2']
      });

      const session = await SurveySession.create({
        surveyQuiz: surveyQuiz._id,
        surveyHost: host._id,
        surveyJoinCode: 'TEST123',
        surveyQuestions: [question1._id, question2._id],
        surveyCurrentQuestion: question1._id
      });

      const populatedSession = await SurveySession.findById(session._id)
        .populate('surveyQuestions surveyCurrentQuestion');

      expect(populatedSession.surveyQuestions).toHaveLength(2);
      expect(populatedSession.surveyQuestions[0].question).toBe('Q1');
      expect(populatedSession.surveyCurrentQuestion.question).toBe('Q1');
    });
  });

  describe('Status and Time Management Tests', () => {
    test('should handle status transitions and time tracking', async () => {
      const surveyQuiz = await SurveyQuiz.create({ title: 'Test Quiz' });
      const host = await User.create({ name: 'Host' });

      const session = await SurveySession.create({
        surveyQuiz: surveyQuiz._id,
        surveyHost: host._id,
        surveyJoinCode: 'TEST123'
      });

      // Test initial status
      expect(session.surveyStatus).toBe('waiting');
      expect(session.startTime).toBeUndefined();
      expect(session.endTime).toBeUndefined();

      // Test status transition to in_progress
      session.surveyStatus = 'in_progress';
      session.startTime = new Date();
      await session.save();

      const inProgressSession = await SurveySession.findById(session._id);
      expect(inProgressSession.surveyStatus).toBe('in_progress');
      expect(inProgressSession.startTime).toBeDefined();

      // Test status transition to completed
      inProgressSession.surveyStatus = 'completed';
      inProgressSession.endTime = new Date();
      await inProgressSession.save();

      const completedSession = await SurveySession.findById(session._id);
      expect(completedSession.surveyStatus).toBe('completed');
      expect(completedSession.endTime).toBeDefined();
    });
  });

  describe('Update Tests', () => {
    test('should update session properties correctly', async () => {
      const surveyQuiz = await SurveyQuiz.create({ title: 'Test Quiz' });
      const host = await User.create({ name: 'Host' });
      const question = await SurveyQuestion.create({ question: 'Q1' });

      const session = await SurveySession.create({
        surveyQuiz: surveyQuiz._id,
        surveyHost: host._id,
        surveyJoinCode: 'TEST123'
      });

      const updateData = {
        surveyStatus: 'in_progress',
        surveyCurrentQuestion: question._id,
        surveyQrData: 'updated-qr-data'
      };

      await SurveySession.findByIdAndUpdate(session._id, updateData);
      const updatedSession = await SurveySession.findById(session._id);
      
      expect(updatedSession.surveyStatus).toBe(updateData.surveyStatus);
      expect(updatedSession.surveyCurrentQuestion.toString()).toBe(question._id.toString());
      expect(updatedSession.surveyQrData).toBe(updateData.surveyQrData);
    });
  });
});