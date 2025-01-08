const request = require('supertest');
const express = require('express');
const router = require('../../routes/categoryroutes');
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getQuizCountForCategory,
} = require('../../controllers/categoryController');

// Mock the controller functions
jest.mock('../../controllers/categoryController', () => ({
  createCategory: jest.fn(),
  getCategories: jest.fn(),
  getCategoryById: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
  getQuizCountForCategory: jest.fn(),
}));

// Mock the authentication middleware
jest.mock('../../middlewares/auth', () => {
  const authMock = jest.fn((req, res, next) => next());
  const isAdminMock = jest.fn((req, res, next) => next());

  return {
    auth: authMock,
    isAdmin: isAdminMock,
  };
});

// Create a test app with the router
const app = express();
app.use(express.json());
app.use('/api', router);

describe('CategoryRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/categories - should call createCategory', async () => {
    createCategory.mockImplementation((req, res) =>
      res.status(201).json({ message: 'Category created successfully' })
    );

    const categoryData = { name: 'Science' };

    const response = await request(app).post('/api/categories').send(categoryData);

    expect(createCategory).toHaveBeenCalledWith(
      expect.objectContaining({ body: categoryData }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Category created successfully');
  });

  test('GET /api/categories - should call getCategories', async () => {
    getCategories.mockImplementation((req, res) =>
      res.status(200).json([{ id: 1, name: 'Science' }])
    );

    const response = await request(app).get('/api/categories');

    expect(getCategories).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 1, name: 'Science' }]);
  });

  test('GET /api/categories/:id - should call getCategoryById', async () => {
    const categoryId = '123';
    getCategoryById.mockImplementation((req, res) =>
      res.status(200).json({ id: categoryId, name: 'Science' })
    );

    const response = await request(app).get(`/api/categories/${categoryId}`);

    expect(getCategoryById).toHaveBeenCalledWith(
      expect.objectContaining({ params: { id: categoryId } }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: categoryId, name: 'Science' });
  });

  test('PUT /api/categories/:id - should call updateCategory', async () => {
    const categoryId = '123';
    const updatedData = { name: 'Mathematics' };
    updateCategory.mockImplementation((req, res) =>
      res.status(200).json({ message: 'Category updated successfully' })
    );

    const response = await request(app).put(`/api/categories/${categoryId}`).send(updatedData);

    expect(updateCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { id: categoryId },
        body: updatedData,
      }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Category updated successfully');
  });

  test('DELETE /api/categories/:id - should call deleteCategory', async () => {
    const categoryId = '123';
    deleteCategory.mockImplementation((req, res) =>
      res.status(200).json({ message: 'Category deleted successfully' })
    );

    const response = await request(app).delete(`/api/categories/${categoryId}`);

    expect(deleteCategory).toHaveBeenCalledWith(
      expect.objectContaining({ params: { id: categoryId } }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Category deleted successfully');
  });

  test('GET /api/category/:categoryId/quiz-count - should call getQuizCountForCategory', async () => {
    const categoryId = '123';
    getQuizCountForCategory.mockImplementation((req, res) =>
      res.status(200).json({ categoryId, quizCount: 10 })
    );

    const response = await request(app).get(`/api/category/${categoryId}/quiz-count`);

    expect(getQuizCountForCategory).toHaveBeenCalledWith(
      expect.objectContaining({ params: { categoryId } }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ categoryId, quizCount: 10 });
  });
});
