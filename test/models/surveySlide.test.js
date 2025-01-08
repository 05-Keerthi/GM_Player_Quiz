const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SurveySlide = require('../../models/surveySlide'); 

// Create a mock SurveyQuiz model for testing
const surveyQuizSchema = new mongoose.Schema({
  title: String,
  description: String
});
const SurveyQuiz = mongoose.model('SurveyQuiz', surveyQuizSchema);

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
  await SurveySlide.deleteMany({});
  await SurveyQuiz.deleteMany({});
});

describe('SurveySlide Model Test Suite', () => {
  describe('Validation Tests', () => {
    test('should validate a valid survey slide', async () => {
      const surveyQuizId = new mongoose.Types.ObjectId();
      const mediaId = new mongoose.Types.ObjectId();
      
      const validSurveySlide = {
        surveyQuiz: surveyQuizId,
        surveyTitle: 'Test Survey Title',
        surveyContent: 'Test Survey Content',
        imageUrl: mediaId,
        position: 1
      };

      const surveySlide = new SurveySlide(validSurveySlide);
      const savedSurveySlide = await surveySlide.save();
      
      expect(savedSurveySlide._id).toBeDefined();
      expect(savedSurveySlide.surveyQuiz.toString()).toBe(surveyQuizId.toString());
      expect(savedSurveySlide.surveyTitle).toBe(validSurveySlide.surveyTitle);
      expect(savedSurveySlide.surveyContent).toBe(validSurveySlide.surveyContent);
      expect(savedSurveySlide.imageUrl.toString()).toBe(mediaId.toString());
      expect(savedSurveySlide.position).toBe(validSurveySlide.position);
    });

    test('should fail validation when surveyQuiz is missing', async () => {
      const surveySlideWithoutQuiz = new SurveySlide({
        surveyTitle: 'Test Title',
        surveyContent: 'Test Content'
      });

      let err;
      try {
        await surveySlideWithoutQuiz.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.surveyQuiz).toBeDefined();
    });

    test('should fail validation when surveyTitle is missing', async () => {
      const surveyQuizId = new mongoose.Types.ObjectId();
      
      const surveySlideWithoutTitle = new SurveySlide({
        surveyQuiz: surveyQuizId,
        surveyContent: 'Test Content'
      });

      let err;
      try {
        await surveySlideWithoutTitle.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.surveyTitle).toBeDefined();
    });

    test('should fail validation when surveyContent is missing', async () => {
      const surveyQuizId = new mongoose.Types.ObjectId();
      
      const surveySlideWithoutContent = new SurveySlide({
        surveyQuiz: surveyQuizId,
        surveyTitle: 'Test Title'
      });

      let err;
      try {
        await surveySlideWithoutContent.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(err.errors.surveyContent).toBeDefined();
    });

    test('should allow missing imageUrl', async () => {
      const surveyQuizId = new mongoose.Types.ObjectId();
      
      const surveySlideWithoutImage = {
        surveyQuiz: surveyQuizId,
        surveyTitle: 'Test Title',
        surveyContent: 'Test Content',
        position: 1
      };

      const surveySlide = new SurveySlide(surveySlideWithoutImage);
      const savedSurveySlide = await surveySlide.save();
      
      expect(savedSurveySlide._id).toBeDefined();
      expect(savedSurveySlide.imageUrl).toBeUndefined();
    });

    test('should allow missing position', async () => {
      const surveyQuizId = new mongoose.Types.ObjectId();
      
      const surveySlideWithoutPosition = {
        surveyQuiz: surveyQuizId,
        surveyTitle: 'Test Title',
        surveyContent: 'Test Content'
      };

      const surveySlide = new SurveySlide(surveySlideWithoutPosition);
      const savedSurveySlide = await surveySlide.save();
      
      expect(savedSurveySlide._id).toBeDefined();
      expect(savedSurveySlide.position).toBeUndefined();
    });
  });

  describe('Update Tests', () => {
    test('should correctly update survey slide properties', async () => {
      const surveyQuizId = new mongoose.Types.ObjectId();
      const newMediaId = new mongoose.Types.ObjectId();
      
      const surveySlide = await SurveySlide.create({
        surveyQuiz: surveyQuizId,
        surveyTitle: 'Original Title',
        surveyContent: 'Original Content',
        position: 1
      });

      const updatedData = {
        surveyTitle: 'Updated Title',
        surveyContent: 'Updated Content',
        imageUrl: newMediaId,
        position: 2
      };

      await SurveySlide.findByIdAndUpdate(surveySlide._id, updatedData);
      const updatedSurveySlide = await SurveySlide.findById(surveySlide._id);
      
      expect(updatedSurveySlide.surveyTitle).toBe(updatedData.surveyTitle);
      expect(updatedSurveySlide.surveyContent).toBe(updatedData.surveyContent);
      expect(updatedSurveySlide.imageUrl.toString()).toBe(newMediaId.toString());
      expect(updatedSurveySlide.position).toBe(updatedData.position);
      expect(updatedSurveySlide.surveyQuiz.toString()).toBe(surveyQuizId.toString());
    });
  });

  describe('Reference Population Tests', () => {
    test('should be able to populate surveyQuiz reference', async () => {
      // Create a real SurveyQuiz document
      const surveyQuiz = await SurveyQuiz.create({
        title: 'Test Quiz',
        description: 'Test Description'
      });
      
      // Create a SurveySlide that references the real SurveyQuiz
      const surveySlide = await SurveySlide.create({
        surveyQuiz: surveyQuiz._id,
        surveyTitle: 'Test Title',
        surveyContent: 'Test Content'
      });

      // Test population
      const populatedSurveySlide = await SurveySlide.findById(surveySlide._id).populate('surveyQuiz');
      
      expect(populatedSurveySlide.surveyQuiz).toBeDefined();
      expect(populatedSurveySlide.surveyQuiz._id.toString()).toBe(surveyQuiz._id.toString());
      expect(populatedSurveySlide.surveyQuiz.title).toBe('Test Quiz');
      expect(populatedSurveySlide.surveyQuiz.description).toBe('Test Description');
    });
  });
});