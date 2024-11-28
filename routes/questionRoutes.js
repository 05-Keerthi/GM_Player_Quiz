const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const {
  addQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion
} = require('../controllers/questionController');

// Add a new question to a quiz
router.post('/quizzes/:quizId/questions', auth, isAdmin, addQuestion);

// Get all questions for a specific quiz
router.get('/quizzes/:quizId/questions', auth, getQuestions);

// Get details of a specific question
router.get('/questions/:id', auth, getQuestionById);

// Update a question (admin only)
router.put('/questions/:id', auth, isAdmin, updateQuestion);

// Delete a question (admin only)
router.delete('/questions/:id', auth, isAdmin, deleteQuestion);

module.exports = router;
