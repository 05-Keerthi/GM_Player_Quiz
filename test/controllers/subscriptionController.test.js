const Subscription = require('../../models/subscription');
const {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  updateSubscription,
  cancelSubscription,
} = require('../../controllers/subscriptionController');

jest.mock('../../models/subscription');

describe('Subscription Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { _id: 'user123' }, // Mocked authenticated user
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('createSubscription', () => {
    it('should create a subscription successfully', async () => {
      req.body = {
        planType: 'premium',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        paymentDetails: { method: 'credit card', amount: 100 },
      };

      const mockSubscription = {
        _id: 'sub123',
        ...req.body,
        user: req.user._id,
        save: jest.fn().mockResolvedValue(undefined),
        toObject: jest.fn().mockReturnValue({
          _id: 'sub123',
          ...req.body,
          user: req.user._id,
        }),
      };

      Subscription.mockImplementation(() => mockSubscription);

      await createSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Subscription created successfully',
        subscription: expect.objectContaining({ _id: 'sub123' }),
      });
    });

    it('should handle server errors', async () => {
      req.body = { planType: 'premium' };
      Subscription.mockImplementation(() => {
        throw new Error('Database error');
      });

      await createSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: 'Database error',
      });
    });
  });

  describe('getSubscriptions', () => {
    it('should fetch all subscriptions for a user', async () => {
      const mockSubscriptions = [
        { _id: 'sub1', planType: 'basic', user: req.user._id },
        { _id: 'sub2', planType: 'premium', user: req.user._id },
      ];
      Subscription.find.mockResolvedValue(mockSubscriptions);

      await getSubscriptions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        subscriptions: expect.arrayContaining([
          expect.objectContaining({ _id: 'sub1' }),
        ]),
      });
    });

    it('should handle server errors', async () => {
      Subscription.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      await getSubscriptions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: 'Database error',
      });
    });
  });

  describe('getSubscriptionById', () => {
    it('should fetch a subscription by ID', async () => {
      req.params = { id: 'sub123' };
      const mockSubscription = { _id: 'sub123', planType: 'basic', user: req.user._id };
      Subscription.findById.mockResolvedValue(mockSubscription);

      await getSubscriptionById(req, res);
    });

    it('should return 404 if subscription not found', async () => {
      req.params = { id: 'nonexistent' };
      Subscription.findById.mockResolvedValue(null);

      await getSubscriptionById(req, res);
    });
  });

  describe('updateSubscription', () => {
    it('should update a subscription successfully', async () => {
      req.params = { id: 'sub123' };
      req.body = { planType: 'updated-plan' };

      const mockSubscription = { _id: 'sub123', planType: 'basic' };
      Subscription.findByIdAndUpdate.mockResolvedValue({
        ...mockSubscription,
        planType: 'updated-plan',
      });

      await updateSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Subscription updated successfully',
        subscription: expect.objectContaining({ planType: 'updated-plan' }),
      });
    });

    it('should return 404 if subscription not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { planType: 'updated-plan' };
      Subscription.findByIdAndUpdate.mockResolvedValue(null);

      await updateSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Subscription not found',
      });
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription successfully', async () => {
      req.params = { id: 'sub123' };

      const mockSubscription = { _id: 'sub123', isActive: true };
      Subscription.findByIdAndUpdate.mockResolvedValue({
        ...mockSubscription,
        isActive: false,
        endDate: new Date(),
      });

      await cancelSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Subscription cancelled successfully',
        subscription: expect.objectContaining({ isActive: false }),
      });
    });

    it('should return 404 if subscription not found', async () => {
      req.params = { id: 'nonexistent' };
      Subscription.findByIdAndUpdate.mockResolvedValue(null);

      await cancelSubscription(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Subscription not found',
      });
    });
  });
});
