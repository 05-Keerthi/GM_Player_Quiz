const request = require('supertest');
const express = require('express');
const router = require('../../routes/slideRoutes');

// Mock middlewares
jest.mock('../../middlewares/auth', () => ({
  auth: jest.fn((req, res, next) => next()),
  isAdmin: jest.fn((req, res, next) => next()),
}));

// Mock controller functions
jest.mock('../../controllers/slideController', () => ({
  addSlide: jest.fn((req, res) => res.status(201).json({ message: 'Slide added successfully' })),
  getSlides: jest.fn((req, res) => res.status(200).json({ slides: [] })),
  getSlide: jest.fn((req, res) => res.status(200).json({ slide: { id: req.params.id, title: 'Sample Slide' } })),
  updateSlide: jest.fn((req, res) => res.status(200).json({ message: 'Slide updated successfully' })),
  deleteSlide: jest.fn((req, res) => res.status(200).json({ message: 'Slide deleted successfully' })),
}));

const { auth, isAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use('/api', router);

describe('Slide Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test POST /api/quizzes/:quizId/slides
  it('should call addSlide when a valid POST request is made to /api/quizzes/:quizId/slides', async () => {
    const quizId = '123';
    const res = await request(app).post(`/api/quizzes/${quizId}/slides`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Slide added successfully');
  });

  // Test GET /api/quizzes/:quizId/slides
  it('should call getSlides when a valid GET request is made to /api/quizzes/:quizId/slides', async () => {
    const quizId = '123';
    const res = await request(app).get(`/api/quizzes/${quizId}/slides`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(0); // isAdmin is not required for this route
    expect(res.statusCode).toBe(200);
    expect(res.body.slides).toEqual([]);
  });

  // Test GET /api/slides/:id
  it('should call getSlide when a valid GET request is made to /api/slides/:id', async () => {
    const slideId = '456';
    const res = await request(app).get(`/api/slides/${slideId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(0); // isAdmin is not required for this route
    expect(res.statusCode).toBe(200);
    expect(res.body.slide).toEqual({ id: slideId, title: 'Sample Slide' });
  });

  // Test PUT /api/slides/:id
  it('should call updateSlide when a valid PUT request is made to /api/slides/:id', async () => {
    const slideId = '456';
    const res = await request(app).put(`/api/slides/${slideId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Slide updated successfully');
  });

  // Test DELETE /api/slides/:id
  it('should call deleteSlide when a valid DELETE request is made to /api/slides/:id', async () => {
    const slideId = '456';
    const res = await request(app).delete(`/api/slides/${slideId}`);

    expect(auth).toHaveBeenCalledTimes(1);
    expect(isAdmin).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Slide deleted successfully');
  });
});
