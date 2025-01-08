const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Category = require('../../models/category');

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

describe('Category Model Unit Tests', () => {
  afterEach(async () => {
    await Category.deleteMany({});
  });

  test('should create a Category with valid data', async () => {
    const categoryData = {
      name: 'Mathematics',
      description: 'All math related questions'
    };

    const category = await Category.create(categoryData);

    expect(category._id).toBeDefined();
    expect(category.name).toBe(categoryData.name);
    expect(category.description).toBe(categoryData.description);
  });

  test('should require name field', async () => {
    const categoryData = {
      description: 'Test description'
    };

    await expect(Category.create(categoryData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should enforce unique name constraint', async () => {
    const categoryData = {
      name: 'Science',
      description: 'Science related questions'
    };

    await Category.create(categoryData);
    
    const duplicateCategoryData = {
      name: 'Science',
      description: 'Another science category'
    };

    await expect(Category.create(duplicateCategoryData)).rejects.toThrow(mongoose.Error.MongoServerError);
  });

  test('should allow creation without description', async () => {
    const categoryData = {
      name: 'History'
    };

    const category = await Category.create(categoryData);

    expect(category._id).toBeDefined();
    expect(category.name).toBe(categoryData.name);
    expect(category.description).toBeUndefined();
  });

  test('should successfully update category', async () => {
    const categoryData = {
      name: 'Physics',
      description: 'Physics related questions'
    };

    const category = await Category.create(categoryData);
    
    const updatedDescription = 'Updated physics description';
    category.description = updatedDescription;
    await category.save();

    const updatedCategory = await Category.findById(category._id);
    expect(updatedCategory.description).toBe(updatedDescription);
  });
});