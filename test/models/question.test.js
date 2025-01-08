const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Question = require('../../models/question');

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

describe('Question Model Unit Tests', () => {
  afterEach(async () => {
    await Question.deleteMany({});
  });

  test('should create a multiple choice Question with valid data', async () => {
    const questionData = {
      quiz: new mongoose.Types.ObjectId(),
      title: 'What is the capital of France?',
      type: 'multiple_choice',
      options: [
        { text: 'Paris', isCorrect: true },
        { text: 'London', isCorrect: false },
        { text: 'Berlin', isCorrect: false }
      ],
      correctAnswer: ['Paris'],
      points: 10,
      timer: 30
    };

    const question = await Question.create(questionData);

    expect(question._id).toBeDefined();
    expect(question.quiz.toString()).toBe(questionData.quiz.toString());
    expect(question.title).toBe(questionData.title);
    expect(question.type).toBe(questionData.type);
    expect(question.options).toHaveLength(3);
    expect(question.correctAnswer).toEqual(questionData.correctAnswer);
    expect(question.points).toBe(questionData.points);
    expect(question.timer).toBe(questionData.timer);
  });

  test('should require quiz, title and type fields', async () => {
    const questionData = {
      options: [
        { text: 'Option 1', isCorrect: true }
      ],
      points: 5
    };

    await expect(Question.create(questionData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should only allow valid question types', async () => {
    const questionData = {
      quiz: new mongoose.Types.ObjectId(),
      title: 'Test Question',
      type: 'invalid_type',
      options: [{ text: 'Option 1', isCorrect: true }]
    };

    await expect(Question.create(questionData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should test all valid question types', async () => {
    const validTypes = ['multiple_choice', 'multiple_select', 'true_false', 'open_ended', 'poll'];
    const quizId = new mongoose.Types.ObjectId();

    for (const type of validTypes) {
      const questionData = {
        quiz: quizId,
        title: `Test ${type} question`,
        type: type,
        options: type !== 'open_ended' ? [{ text: 'Option 1', isCorrect: true }] : []
      };

      const question = await Question.create(questionData);
      expect(question.type).toBe(type);
    }
  });

  test('should handle options with colors', async () => {
    const questionData = {
      quiz: new mongoose.Types.ObjectId(),
      title: 'Colored options question',
      type: 'multiple_choice',
      options: [
        { text: 'Red Option', color: '#FF0000', isCorrect: true },
        { text: 'Blue Option', color: '#0000FF', isCorrect: false }
      ]
    };

    const question = await Question.create(questionData);
    expect(question.options[0].color).toBe('#FF0000');
    expect(question.options[1].color).toBe('#0000FF');
  });

  test('should set default values correctly', async () => {
    const questionData = {
      quiz: new mongoose.Types.ObjectId(),
      title: 'Default values test',
      type: 'multiple_choice',
      options: [{ text: 'Option 1', isCorrect: true }]
    };

    const question = await Question.create(questionData);
    expect(question.points).toBe(10);
    expect(question.timer).toBe(10);
  });

  test('should handle imageUrl reference', async () => {
    const questionData = {
      quiz: new mongoose.Types.ObjectId(),
      title: 'Question with image',
      type: 'multiple_choice',
      imageUrl: new mongoose.Types.ObjectId(),
      options: [{ text: 'Option 1', isCorrect: true }]
    };

    const question = await Question.create(questionData);
    expect(question.imageUrl).toBeDefined();
    expect(mongoose.Types.ObjectId.isValid(question.imageUrl)).toBeTruthy();
  });

  test('should handle multiple correct answers for multiple select', async () => {
    const questionData = {
      quiz: new mongoose.Types.ObjectId(),
      title: 'Multiple select question',
      type: 'multiple_select',
      options: [
        { text: 'Option 1', isCorrect: true },
        { text: 'Option 2', isCorrect: true },
        { text: 'Option 3', isCorrect: false }
      ],
      correctAnswer: ['Option 1', 'Option 2']
    };

    const question = await Question.create(questionData);
    expect(question.options.filter(opt => opt.isCorrect)).toHaveLength(2);
    expect(question.correctAnswer).toHaveLength(2);
  });

  test('should update question properties', async () => {
    const questionData = {
      quiz: new mongoose.Types.ObjectId(),
      title: 'Original title',
      type: 'multiple_choice',
      options: [{ text: 'Option 1', isCorrect: true }],
      points: 10,
      timer: 20
    };

    const question = await Question.create(questionData);
    
    question.title = 'Updated title';
    question.points = 15;
    await question.save();

    const updatedQuestion = await Question.findById(question._id);
    expect(updatedQuestion.title).toBe('Updated title');
    expect(updatedQuestion.points).toBe(15);
  });
});