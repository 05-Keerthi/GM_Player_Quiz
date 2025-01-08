const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Subscription = require('../../models/subscription');
const { Types: { ObjectId } } = mongoose;

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Subscription Model Unit Tests', () => {
  afterEach(async () => {
    await Subscription.deleteMany({});
  });

  test('should create a Subscription with valid data', async () => {
    const subscriptionData = {
      user: new ObjectId(),
      planType: 'pro',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
      paymentDetails: {
        paymentMethod: 'credit_card',
        amountPaid: 99.99,
        currency: 'USD',
        transactionId: 'txn_123456'
      }
    };

    const subscription = await Subscription.create(subscriptionData);

    expect(subscription._id).toBeDefined();
    expect(subscription.user.toString()).toBe(subscriptionData.user.toString());
    expect(subscription.planType).toBe(subscriptionData.planType);
    expect(subscription.startDate).toBeDefined();
    expect(subscription.endDate).toBeDefined();
    expect(subscription.isActive).toBe(true);
    expect(subscription.paymentDetails.paymentMethod).toBe(subscriptionData.paymentDetails.paymentMethod);
    expect(subscription.paymentDetails.amountPaid).toBe(subscriptionData.paymentDetails.amountPaid);
    expect(subscription.paymentDetails.currency).toBe(subscriptionData.paymentDetails.currency);
    expect(subscription.paymentDetails.transactionId).toBe(subscriptionData.paymentDetails.transactionId);
  });

  test('should require user field', async () => {
    const subscriptionData = {
      planType: 'pro',
      startDate: new Date(),
      isActive: true
    };

    await expect(Subscription.create(subscriptionData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should validate plan type enum values', async () => {
    const subscriptionData = {
      user: new ObjectId(),
      planType: 'invalid_plan', // Invalid plan type
      startDate: new Date()
    };

    await expect(Subscription.create(subscriptionData)).rejects.toThrow(mongoose.Error.ValidationError);
  });

  test('should create subscription with default free plan', async () => {
    const subscriptionData = {
      user: new ObjectId(),
      startDate: new Date()
    };

    const subscription = await Subscription.create(subscriptionData);

    expect(subscription.planType).toBe('free');
  });

  test('should create subscription with default USD currency', async () => {
    const subscriptionData = {
      user: new ObjectId(),
      paymentDetails: {
        paymentMethod: 'credit_card',
        amountPaid: 99.99,
        transactionId: 'txn_123456'
      }
    };

    const subscription = await Subscription.create(subscriptionData);

    expect(subscription.paymentDetails.currency).toBe('USD');
  });

  test('should update subscription plan type', async () => {
    const subscriptionData = {
      user: new ObjectId(),
      planType: 'free'
    };

    const subscription = await Subscription.create(subscriptionData);
    
    subscription.planType = 'pro';
    await subscription.save();

    const updatedSubscription = await Subscription.findById(subscription._id);
    expect(updatedSubscription.planType).toBe('pro');
  });

  test('should accept all valid plan types', async () => {
    const validPlanTypes = ['free', 'pro', 'enterprise'];

    for (const planType of validPlanTypes) {
      const subscriptionData = {
        user: new ObjectId(),
        planType: planType
      };

      const subscription = await Subscription.create(subscriptionData);
      expect(subscription.planType).toBe(planType);
    }
  });

  test('should update subscription status', async () => {
    const subscriptionData = {
      user: new ObjectId(),
      planType: 'pro',
      isActive: true
    };

    const subscription = await Subscription.create(subscriptionData);
    
    subscription.isActive = false;
    await subscription.save();

    const updatedSubscription = await Subscription.findById(subscription._id);
    expect(updatedSubscription.isActive).toBe(false);
  });

  test('should find active subscriptions for a user', async () => {
    const userId = new ObjectId();
    const activeSubscriptionData = {
      user: userId,
      planType: 'pro',
      isActive: true
    };

    const inactiveSubscriptionData = {
      user: userId,
      planType: 'free',
      isActive: false
    };

    await Subscription.create(activeSubscriptionData);
    await Subscription.create(inactiveSubscriptionData);

    const activeSubscriptions = await Subscription.find({ user: userId, isActive: true });
    expect(activeSubscriptions).toHaveLength(1);
    expect(activeSubscriptions[0].planType).toBe('pro');
  });

  test('should update payment details', async () => {
    const subscriptionData = {
      user: new ObjectId(),
      planType: 'pro',
      paymentDetails: {
        paymentMethod: 'credit_card',
        amountPaid: 99.99,
        currency: 'USD',
        transactionId: 'txn_123456'
      }
    };

    const subscription = await Subscription.create(subscriptionData);
    
    const newPaymentDetails = {
      paymentMethod: 'paypal',
      amountPaid: 199.99,
      currency: 'EUR',
      transactionId: 'txn_789012'
    };

    subscription.paymentDetails = newPaymentDetails;
    await subscription.save();

    const updatedSubscription = await Subscription.findById(subscription._id);
    expect(updatedSubscription.paymentDetails.paymentMethod).toBe(newPaymentDetails.paymentMethod);
    expect(updatedSubscription.paymentDetails.amountPaid).toBe(newPaymentDetails.amountPaid);
    expect(updatedSubscription.paymentDetails.currency).toBe(newPaymentDetails.currency);
    expect(updatedSubscription.paymentDetails.transactionId).toBe(newPaymentDetails.transactionId);
  });
});