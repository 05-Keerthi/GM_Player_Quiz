const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middlewares/auth');
const subscriptionController = require('../controllers/subscriptionController');

// Routes
router.post('/subscriptions', auth, subscriptionController.createSubscription);
router.get('/subscriptions', auth, subscriptionController.getSubscriptions);
router.get('/subscriptions/:id', auth, subscriptionController.getSubscriptionById);
router.put('/subscriptions/:id', auth, subscriptionController.updateSubscription);
router.delete('/subscriptions/:id', auth, subscriptionController.cancelSubscription);

module.exports = router;
