const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Report = require('../../models/Report');
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

describe('Report Model Unit Tests', () => {
  afterEach(async () => {
    await Report.deleteMany({});
  });

  test('should create a Report with valid data', async () => {
    const reportData = {
      quiz: new ObjectId(),
      user: new ObjectId(),
      sessionId: new ObjectId(),
      totalQuestions: 10,
      correctAnswers: 8,
      incorrectAnswers: 2,
      totalScore: 80
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
    expect(report.completedAt).toBeDefined();
  });

  test('should require all mandatory fields', async () => {
    const invalidReportData = {
      quiz: new ObjectId(),
      user: new ObjectId(),
      // missing sessionId
      totalQuestions: 10,
      correctAnswers: 8,
      incorrectAnswers: 2,
      // missing totalScore
    };

    await expect(Report.create(invalidReportData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should successfully create multiple reports for same user', async () => {
    const userId = new ObjectId();
    const reportData1 = {
      quiz: new ObjectId(),
      user: userId,
      sessionId: new ObjectId(),
      totalQuestions: 10,
      correctAnswers: 8,
      incorrectAnswers: 2,
      totalScore: 80
    };

    const reportData2 = {
      quiz: new ObjectId(),
      user: userId,
      sessionId: new ObjectId(),
      totalQuestions: 5,
      correctAnswers: 4,
      incorrectAnswers: 1,
      totalScore: 90
    };

    const report1 = await Report.create(reportData1);
    const report2 = await Report.create(reportData2);

    expect(report1._id).toBeDefined();
    expect(report2._id).toBeDefined();
    expect(report1._id).not.toEqual(report2._id);
  });

  test('should update report scores', async () => {
    const reportData = {
      quiz: new ObjectId(),
      user: new ObjectId(),
      sessionId: new ObjectId(),
      totalQuestions: 10,
      correctAnswers: 8,
      incorrectAnswers: 2,
      totalScore: 80
    };

    const report = await Report.create(reportData);
    
    const updatedData = {
      correctAnswers: 9,
      incorrectAnswers: 1,
      totalScore: 90
    };

    const updatedReport = await Report.findByIdAndUpdate(
      report._id,
      updatedData,
      { new: true }
    );

    expect(updatedReport.correctAnswers).toBe(updatedData.correctAnswers);
    expect(updatedReport.incorrectAnswers).toBe(updatedData.incorrectAnswers);
    expect(updatedReport.totalScore).toBe(updatedData.totalScore);
  });

  test('should query reports by user', async () => {
    const userId = new ObjectId();
    const reportData1 = {
      quiz: new ObjectId(),
      user: userId,
      sessionId: new ObjectId(),
      totalQuestions: 10,
      correctAnswers: 8,
      incorrectAnswers: 2,
      totalScore: 80
    };

    const reportData2 = {
      quiz: new ObjectId(),
      user: userId,
      sessionId: new ObjectId(),
      totalQuestions: 5,
      correctAnswers: 4,
      incorrectAnswers: 1,
      totalScore: 90
    };

    await Report.create(reportData1);
    await Report.create(reportData2);

    const userReports = await Report.find({ user: userId });
    expect(userReports).toHaveLength(2);
    expect(userReports[0].user.toString()).toBe(userId.toString());
    expect(userReports[1].user.toString()).toBe(userId.toString());
  });
});