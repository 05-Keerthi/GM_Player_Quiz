const express = require('express');
const { register, login, refreshToken, getProfile, logout, listUsers } = require('../controllers/authController'); // Include logout
const { auth,isAdminOrTenantAdmin  } = require('../middlewares/auth')
const router = express.Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/refresh-token', refreshToken); 
router.get('/auth/me', auth, getProfile);
router.post('/auth/logout', auth, logout); 
router.get('/auth/users', auth,isAdminOrTenantAdmin, listUsers);

module.exports = router;