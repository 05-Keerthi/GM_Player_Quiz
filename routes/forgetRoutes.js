const express = require('express');
const router = express.Router();
const forgetController = require('../controllers/forgetController');
const { auth, isSuperAdmin, protect, admin  } = require('../middlewares/auth')

router.post('/forgot-password',  forgetController.forgotPassword);
router.post('/reset-password', forgetController.resetPassword);
router.post('/verify-reset-code', forgetController.verifyResetCode);

module.exports = router;
