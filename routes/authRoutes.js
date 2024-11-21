const express = require('express');
const { register, login, getProfile, logout, listUsers } = require('../controllers/authController'); // Include logout
const { auth, isSuperAdmin } = require('../middlewares/auth')
const { protect, admin } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', auth, getProfile);
router.post('/auth/logout', logout); 
router.get('/auth/users', protect, admin, listUsers);

module.exports = router;
