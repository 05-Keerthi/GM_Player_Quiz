const Subscription = require('../models/subscription');

// POST /api/subscriptions - Create or start a subscription
exports.createSubscription = async (req, res) => {
  try {
    const { planType, startDate, endDate, paymentDetails } = req.body;

    // Create a new subscription
    const subscription = new Subscription({
      user: req.user._id, 
      planType,
      startDate,
      endDate,
      paymentDetails,
    });

    await subscription.save();
    res.status(201).json({ message: 'Subscription created successfully', subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/subscriptions - Get all subscriptions for the authenticated user
exports.getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id });
    res.status(200).json({ subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/subscriptions/:id - Get details of a specific subscription
exports.getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id).populate('user');
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.status(200).json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /api/subscriptions/:id - Update subscription details
exports.updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const subscription = await Subscription.findByIdAndUpdate(id, updates, { new: true });
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.status(200).json({ message: 'Subscription updated successfully', subscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /api/subscriptions/:id - Cancel a subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByIdAndUpdate(
      id,
      { isActive: false, endDate: new Date() },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.status(200).json({ message: 'Subscription cancelled successfully', subscription });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
