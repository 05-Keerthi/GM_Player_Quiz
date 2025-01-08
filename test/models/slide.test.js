const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Slide = require('../../models/slide');
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

describe('Slide Model Unit Tests', () => {
  afterEach(async () => {
    await Slide.deleteMany({});
  });

  test('should create a Slide with valid data', async () => {
    const slideData = {
      quiz: new ObjectId(),
      title: 'Introduction to MongoDB',
      content: 'This is the content of the slide',
      type: 'classic',
      imageUrl: new ObjectId(),
      position: 1
    };

    const slide = await Slide.create(slideData);

    expect(slide._id).toBeDefined();
    expect(slide.quiz.toString()).toBe(slideData.quiz.toString());
    expect(slide.title).toBe(slideData.title);
    expect(slide.content).toBe(slideData.content);
    expect(slide.type).toBe(slideData.type);
    expect(slide.imageUrl.toString()).toBe(slideData.imageUrl.toString());
    expect(slide.position).toBe(slideData.position);
  });

  test('should require mandatory fields', async () => {
    const invalidSlideData = {
      quiz: new ObjectId(),
      // missing title
      content: 'This is the content',
      // missing type
    };

    await expect(Slide.create(invalidSlideData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should validate slide type enum values', async () => {
    const invalidSlideData = {
      quiz: new ObjectId(),
      title: 'Test Slide',
      content: 'Test content',
      type: 'invalid_type' // Invalid type
    };

    await expect(Slide.create(invalidSlideData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should accept all valid slide types', async () => {
    const validTypes = ['classic', 'big_title', 'bullet_points'];

    for (const type of validTypes) {
      const slideData = {
        quiz: new ObjectId(),
        title: 'Test Slide',
        content: 'Test content',
        type: type
      };

      const slide = await Slide.create(slideData);
      expect(slide.type).toBe(type);
    }
  });

  test('should create slide without optional fields', async () => {
    const slideData = {
      quiz: new ObjectId(),
      title: 'Test Slide',
      content: 'Test content',
      type: 'classic'
      // imageUrl and position are optional
    };

    const slide = await Slide.create(slideData);

    expect(slide._id).toBeDefined();
    expect(slide.imageUrl).toBeUndefined();
    expect(slide.position).toBeUndefined();
  });

  test('should successfully update slide content', async () => {
    const slideData = {
      quiz: new ObjectId(),
      title: 'Original Title',
      content: 'Original content',
      type: 'classic'
    };

    const slide = await Slide.create(slideData);
    
    const updatedTitle = 'Updated Title';
    const updatedContent = 'Updated content';
    
    slide.title = updatedTitle;
    slide.content = updatedContent;
    await slide.save();

    const updatedSlide = await Slide.findById(slide._id);
    expect(updatedSlide.title).toBe(updatedTitle);
    expect(updatedSlide.content).toBe(updatedContent);
  });

  test('should update slide position', async () => {
    const slideData = {
      quiz: new ObjectId(),
      title: 'Test Slide',
      content: 'Test content',
      type: 'classic',
      position: 1
    };

    const slide = await Slide.create(slideData);
    
    const newPosition = 3;
    slide.position = newPosition;
    await slide.save();

    const updatedSlide = await Slide.findById(slide._id);
    expect(updatedSlide.position).toBe(newPosition);
  });

  test('should find slides by quiz ID', async () => {
    const quizId = new ObjectId();
    const slideData1 = {
      quiz: quizId,
      title: 'Slide 1',
      content: 'Content 1',
      type: 'classic',
      position: 1
    };

    const slideData2 = {
      quiz: quizId,
      title: 'Slide 2',
      content: 'Content 2',
      type: 'big_title',
      position: 2
    };

    await Slide.create(slideData1);
    await Slide.create(slideData2);

    const quizSlides = await Slide.find({ quiz: quizId }).sort('position');
    expect(quizSlides).toHaveLength(2);
    expect(quizSlides[0].quiz.toString()).toBe(quizId.toString());
    expect(quizSlides[1].quiz.toString()).toBe(quizId.toString());
    expect(quizSlides[0].position).toBeLessThan(quizSlides[1].position);
  });

  test('should handle image URL updates', async () => {
    const slideData = {
      quiz: new ObjectId(),
      title: 'Test Slide',
      content: 'Test content',
      type: 'classic',
      imageUrl: new ObjectId()
    };

    const slide = await Slide.create(slideData);
    
    const newImageId = new ObjectId();
    slide.imageUrl = newImageId;
    await slide.save();

    const updatedSlide = await Slide.findById(slide._id);
    expect(updatedSlide.imageUrl.toString()).toBe(newImageId.toString());
  });
});