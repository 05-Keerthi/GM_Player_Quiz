const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  closeQuiz
} = require('../controllers/quizController');

// Create a new quiz (admin only)
router.post('/quizzes', auth, isAdmin, createQuiz);

// Get all quizzes
router.get('/quizzes', getQuizzes);

// Get details of a specific quiz
router.get('/quizzes/:id', getQuizById);

// Update a quiz (admin only)
router.put('/quizzes/:id', auth, isAdmin, updateQuiz);

// Delete a quiz (admin only)
router.delete('/quizzes/:id', auth, isAdmin, deleteQuiz);

// Publish a quiz (admin only)
router.post('/quizzes/:id/publish', auth, isAdmin, publishQuiz);

// Close a quiz (admin only)
router.post('/quizzes/:id/close', auth, isAdmin, closeQuiz);

module.exports = router;
