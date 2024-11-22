const express = require('express');
const router = express.Router();
const forgetController = require('../controllers/forgetController');
const { auth, isSuperAdmin, protect, admin  } = require('../middlewares/auth')

router.post('/forgot-password', protect, admin, forgetController.forgotPassword);
router.post('/reset-password', protect, admin, forgetController.resetPassword);

module.exports = router;
