const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Report = require('../../models/report');

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

describe('Report Model Unit Tests', () => {
  afterEach(async () => {
    await Report.deleteMany({});
  });

  test('should create a Report with valid data', async () => {
    const reportData = {
      quiz: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      sessionId: new mongoose.Types.ObjectId(),
      totalQuestions: 10,
      correctAnswers: 7,
      incorrectAnswers: 3,
      totalScore: 70,
      questionsAttempted: 8,
      questionsSkipped: 2
    };

    const report = await Report.create(reportData);

    expect(report._id).toBeDefined();
    expect(report.quiz.toString()).toBe(reportData.quiz.toString());
    expect(report.user.toString()).toBe(reportData.user.toString());
    expect(report.sessionId.toString()).toBe(reportData.sessionId.toString());
    expect(report.totalQuestions).toBe(reportData.totalQuestions);
    expect(report.correctAnswers).toBe(reportData.correctAnswers);
    expect(report.incorrectAnswers).toBe(reportData.incorrectAnswers);
    expect(report.totalScore).toBe(reportData.totalScore);
    expect(report.questionsAttempted).toBe(reportData.questionsAttempted);
    expect(report.questionsSkipped).toBe(reportData.questionsSkipped);
    expect(report.completedAt).toBeDefined();
  });

  test('should create a Survey Report with valid data', async () => {
    const reportData = {
      surveyQuiz: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      surveySessionId: new mongoose.Types.ObjectId(),
      surveyTotalQuestions: 5,
      questionsAttempted: 5,
      questionsSkipped: 0
    };

    const report = await Report.create(reportData);

    expect(report._id).toBeDefined();
    expect(report.surveyQuiz.toString()).toBe(reportData.surveyQuiz.toString());
    expect(report.surveySessionId.toString()).toBe(reportData.surveySessionId.toString());
    expect(report.surveyTotalQuestions).toBe(reportData.surveyTotalQuestions);
    expect(report.questionsAttempted).toBe(reportData.questionsAttempted);
    expect(report.questionsSkipped).toBe(reportData.questionsSkipped);
  });

  test('should allow creating report without optional fields', async () => {
    const reportData = {
      user: new mongoose.Types.ObjectId(),
      totalQuestions: 5
    };

    const report = await Report.create(reportData);
    expect(report._id).toBeDefined();
    expect(report.quiz).toBeUndefined();
    expect(report.surveyQuiz).toBeUndefined();
    expect(report.totalScore).toBeUndefined();
  });

  test('should set completedAt automatically', async () => {
    const report = await Report.create({
      user: new mongoose.Types.ObjectId(),
      totalQuestions: 5
    });

    expect(report.completedAt).toBeDefined();
    expect(report.completedAt).toBeInstanceOf(Date);
  });

  test('should update report properties', async () => {
    const reportData = {
      quiz: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      totalQuestions: 10,
      correctAnswers: 5
    };

    const report = await Report.create(reportData);
    
    const updatedCorrectAnswers = 8;
    const updatedTotalScore = 80;
    
    report.correctAnswers = updatedCorrectAnswers;
    report.totalScore = updatedTotalScore;
    await report.save();

    const updatedReport = await Report.findById(report._id);
    expect(updatedReport.correctAnswers).toBe(updatedCorrectAnswers);
    expect(updatedReport.totalScore).toBe(updatedTotalScore);
  });

  test('should validate referenced IDs', async () => {
    const reportData = {
      quiz: 'invalid-id',
      user: new mongoose.Types.ObjectId(),
      totalQuestions: 10
    };

    await expect(Report.create(reportData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should handle both quiz and survey quiz reports', async () => {
    const quizReport = await Report.create({
      quiz: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      sessionId: new mongoose.Types.ObjectId(),
      totalQuestions: 10
    });

    const surveyReport = await Report.create({
      surveyQuiz: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      surveySessionId: new mongoose.Types.ObjectId(),
      surveyTotalQuestions: 5
    });

    expect(quizReport.quiz).toBeDefined();
    expect(quizReport.surveyQuiz).toBeUndefined();
    expect(surveyReport.surveyQuiz).toBeDefined();
    expect(surveyReport.quiz).toBeUndefined();
  });

  test('should calculate correct statistics', async () => {
    const reportData = {
      quiz: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      totalQuestions: 10,
      correctAnswers: 6,
      incorrectAnswers: 2,
      questionsAttempted: 8,
      questionsSkipped: 2,
      totalScore: 60
    };

    const report = await Report.create(reportData);
    
    expect(report.correctAnswers + report.incorrectAnswers).toBe(report.questionsAttempted);
    expect(report.questionsAttempted + report.questionsSkipped).toBe(report.totalQuestions);
  });
});