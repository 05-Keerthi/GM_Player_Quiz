const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

// Create a new category (admin only)
router.post('/categories', auth, isAdmin, createCategory);

// Get all categories
router.get('/categories', getCategories);

// Get a specific category's details
router.get('/categories/:id', getCategoryById);

// Update a category (admin only)
router.put('/categories/:id', auth, isAdmin, updateCategory);

// Delete a category (admin only)
router.delete('/categories/:id', auth, isAdmin, deleteCategory);

// Get a specific category's count according to the quizzes
router.get('/api/category/:categoryId/quiz-count', protect, admin, getQuizCountForCategory);

module.exports = router;
