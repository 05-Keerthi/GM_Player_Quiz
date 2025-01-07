const mongoose = require('mongoose');
const Category = require('../../models/category');
const Quiz = require('../../models/quiz');

// Mock the dependencies
jest.mock('../../models/category');
jest.mock('../../models/quiz');

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getQuizCountForCategory
} = require('../../controllers/categoryController');

describe('Category Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    const mockCategoryData = {
      name: 'Test Category',
      description: 'Test Description'
    };

    it('should create a category successfully', async () => {
      // Setup
      req.body = mockCategoryData;
      
      const mockNewCategory = {
        _id: 'category123',
        ...mockCategoryData,
        save: jest.fn().mockResolvedValue(undefined)
      };

      Category.findOne.mockResolvedValue(null);
      Category.mockImplementation(() => mockNewCategory);

      // Execute
      await createCategory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category created successfully',
        category: mockNewCategory
      });
      expect(mockNewCategory.save).toHaveBeenCalled();
    });

    it('should return error if name is missing', async () => {
      // Setup
      req.body = { description: 'Test Description' };

      // Execute
      await createCategory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Name is required'
      });
    });

    it('should return error if category name already exists', async () => {
      // Setup
      req.body = mockCategoryData;
      Category.findOne.mockResolvedValue({ _id: 'existing123', name: 'Test Category' });

      // Execute
      await createCategory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category name must be unique'
      });
    });
  });

  describe('getCategories', () => {
    it('should get all categories successfully', async () => {
      // Setup
      const mockCategories = [
        { _id: 'category1', name: 'Category 1', description: 'Description 1' },
        { _id: 'category2', name: 'Category 2', description: 'Description 2' }
      ];

      Category.find.mockResolvedValue(mockCategories);

      // Execute
      await getCategories(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCategories);
    });

    it('should handle server error', async () => {
      // Setup
      Category.find.mockRejectedValue(new Error('Database error'));

      // Execute
      await getCategories(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: 'Database error'
      });
    });
  });

  describe('getCategoryById', () => {
    it('should get a single category successfully', async () => {
      // Setup
      req.params = { id: 'category123' };
      const mockCategory = {
        _id: 'category123',
        name: 'Test Category',
        description: 'Test Description'
      };

      Category.findById.mockResolvedValue(mockCategory);

      // Execute
      await getCategoryById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCategory);
    });

    it('should return error if category not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Category.findById.mockResolvedValue(null);

      // Execute
      await getCategoryById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category not found'
      });
    });

    it('should handle invalid category ID', async () => {
      // Setup
      req.params = { id: 'invalid-id' };
      Category.findById.mockRejectedValue({ name: 'CastError' });

      // Execute
      await getCategoryById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid category ID'
      });
    });
  });

  describe('updateCategory', () => {
    const mockUpdateData = {
      name: 'Updated Category',
      description: 'Updated Description'
    };

    it('should update category successfully', async () => {
      // Setup
      req.params = { id: 'category123' };
      req.body = mockUpdateData;

      const mockUpdatedCategory = {
        _id: 'category123',
        ...mockUpdateData
      };

      Category.findOne.mockResolvedValue(null);
      Category.findByIdAndUpdate.mockResolvedValue(mockUpdatedCategory);

      // Execute
      await updateCategory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category updated successfully',
        category: mockUpdatedCategory
      });
    });

    it('should return error if category not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      req.body = mockUpdateData;
      Category.findByIdAndUpdate.mockResolvedValue(null);

      // Execute
      await updateCategory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category not found'
      });
    });

    it('should return error if updated name already exists', async () => {
      // Setup
      req.params = { id: 'category123' };
      req.body = { name: 'Existing Name' };
      Category.findOne.mockResolvedValue({ 
        _id: 'different123', 
        name: 'Existing Name' 
      });

      // Execute
      await updateCategory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category name must be unique'
      });
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      // Setup
      req.params = { id: 'category123' };
      Category.findByIdAndDelete.mockResolvedValue({
        _id: 'category123',
        name: 'Test Category'
      });

      // Execute
      await deleteCategory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category deleted successfully'
      });
    });

    it('should return error if category not found', async () => {
      // Setup
      req.params = { id: 'nonexistent' };
      Category.findByIdAndDelete.mockResolvedValue(null);

      // Execute
      await deleteCategory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category not found'
      });
    });
  });

  describe('getQuizCountForCategory', () => {
    it('should get quiz count successfully', async () => {
      // Setup
      req.params = { categoryId: '507f1f77bcf86cd799439011' };
      
      const mockCategory = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Category',
        description: 'Test Description'
      };

      const mockQuizzes = [
        { _id: 'quiz1', title: 'Quiz 1', description: 'Description 1' },
        { _id: 'quiz2', title: 'Quiz 2', description: 'Description 2' }
      ];

      Category.findById.mockResolvedValue(mockCategory);
      Quiz.find.mockResolvedValue(mockQuizzes);

      // Execute
      await getQuizCountForCategory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: `Quiz count for category ID ${req.params.categoryId}`,
        category: {
          id: mockCategory._id,
          name: mockCategory.name,
          description: mockCategory.description,
        },
        quizCount: 2,
        quizzes: expect.arrayContaining([
          expect.objectContaining({
            id: 'quiz1',
            title: 'Quiz 1',
            description: 'Description 1'
          })
        ])
      });
    });

    it('should return error for invalid category ID format', async () => {
      // Setup
      req.params = { categoryId: 'invalid-id' };

      // Execute
      await getQuizCountForCategory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid category ID'
      });
    });

    it('should return error if category not found', async () => {
      // Setup
      req.params = { categoryId: '507f1f77bcf86cd799439011' };
      Category.findById.mockResolvedValue(null);

      // Execute
      await getQuizCountForCategory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Category not found'
      });
    });
  });
});