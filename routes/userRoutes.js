const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');


router.get('/users', protect, admin, userController.getAllUsers);
router.get('/users/:id', protect, admin, userController.getUserById);
router.put('/users/:id', protect, userController.updateUser);
router.delete('/users/:id', protect, admin, userController.deleteUser);

module.exports = router;
