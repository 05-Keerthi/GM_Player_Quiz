const request = require('supertest');
const express = require('express');
const router = require('../../routes/subscriptionRoutes');

// Mock middlewares
jest.mock('../../middlewares/auth', () => ({
  auth: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/subscriptionController', () => ({
  createSubscription: jest.fn((req, res) =>
    res.status(201).json({ message: 'Subscription created successfully' })
  ),
  getSubscriptions: jest.fn((req, res) =>
    res.status(200).json({ subscriptions: [] })
  ),
  getSubscriptionById: jest.fn((req, res) =>
    res.status(200).json({ subscription: { id: req.params.id, plan: 'Basic' } })
  ),
  updateSubscription: jest.fn((req, res) =>
    res.status(200).json({ message: 'Subscription updated successfully' })
  ),
  cancelSubscription: jest.fn((req, res) =>
    res.status(200).json({ message: 'Subscription canceled successfully' })
  ),
}));

const { auth } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use('/api', router);

describe('Subscription Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test POST /api/subscriptions
  it('should call createSubscription when a valid POST request is made to /api/subscriptions', async () => {
    const res = await request(app).post('/api/subscriptions');

    expect(auth).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Subscription created successfully');
  });

  // Test GET /api/subscriptions
  it('should call getSubscriptions when a valid GET request is made to /api/subscriptions', async () => {
    const res = await request(app).get('/api/subscriptions');

    expect(auth).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.subscriptions).toEqual([]);
  });

  // Test GET /api/subscriptions/:id
  it('should call getSubscriptionById when a valid GET request is made to /api/subscriptions/:id', async () => {
    const subscriptionId = '123';
    const res = await request(app).get(`/api/subscriptions/${subscriptionId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.subscription).toEqual({
      id: subscriptionId,
      plan: 'Basic',
    });
  });

  // Test PUT /api/subscriptions/:id
  it('should call updateSubscription when a valid PUT request is made to /api/subscriptions/:id', async () => {
    const subscriptionId = '123';
    const res = await request(app).put(`/api/subscriptions/${subscriptionId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Subscription updated successfully');
  });

  // Test DELETE /api/subscriptions/:id
  it('should call cancelSubscription when a valid DELETE request is made to /api/subscriptions/:id', async () => {
    const subscriptionId = '123';
    const res = await request(app).delete(`/api/subscriptions/${subscriptionId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Subscription canceled successfully');
  });
});
