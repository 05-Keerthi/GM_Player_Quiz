const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, protect, admin } = require('../middlewares/auth');


router.get('/users', auth, admin, userController.getAllUsers);
router.get('/users/:id', auth, admin, userController.getUserById);
router.put('/users/:id', auth, userController.updateUser);
router.delete('/users/:id', auth, admin, userController.deleteUser);
router.post('/change-password', auth, userController.changePassword);

module.exports = router;
