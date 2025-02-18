const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const slideController = require('../controllers/slideController');

// Route to add a new slide (admin only)
router.post('/quizzes/:quizId/slides', auth, isAdmin, slideController.addSlide);

router.post("/quiz/:quizId/slides/bulk", slideController.addMultipleSlides);

// Route to get all slides for a quiz (no admin check, just protection)
router.get('/quizzes/:quizId/slides', auth, slideController.getSlides);

// Route to get a specific slide's details
router.get('/slides/:id', auth,  slideController.getSlide);

// Route to update a slide (admin only)
router.put('/slides/:id', auth, isAdmin, slideController.updateSlide);

// Route to delete a slide (admin only)
router.delete('/slides/:id', auth, isAdmin, slideController.deleteSlide);

module.exports = router;
