const express = require('express');
const { register, login, getProfile, logout, listUsers } = require('../controllers/authController'); // Include logout
const { auth, admin  } = require('../middlewares/auth')
const router = express.Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', auth, getProfile);
router.post('/auth/logout', logout); 
router.get('/auth/users', auth, admin, listUsers);

module.exports = router;
