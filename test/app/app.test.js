const request = require('supertest');
const express = require('express');
const app = require('../../app'); 

// Mocking the logger
jest.mock('../../config/logger', () => jest.fn((app) => app.use((req, res, next) => next())));

// Mocking route handlers using `require`
jest.mock('../../routes/authRoutes', () => require('express').Router());
jest.mock('../../routes/userRoutes', () => require('express').Router());
jest.mock('../../routes/forgetRoutes', () => require('express').Router());
jest.mock('../../routes/tenantRoutes', () => require('express').Router());
jest.mock('../../routes/categoryRoutes', () => require('express').Router());
jest.mock('../../routes/mediaRoutes', () => require('express').Router());
jest.mock('../../routes/questionRoutes', () => require('express').Router());
jest.mock('../../routes/quizRoutes', () => require('express').Router());
jest.mock('../../routes/slideRoutes', () => require('express').Router());
jest.mock('../../routes/sessionRoutes', () => require('express').Router());
jest.mock('../../routes/answerRoutes', () => require('express').Router());
jest.mock('../../routes/leaderBoardRoutes', () => require('express').Router());
jest.mock('../../routes/notificationRoutes', () => require('express').Router());
jest.mock('../../routes/ActivityLogRoutes', () => require('express').Router());
jest.mock('../../routes/surveyQuestionRoutes', () => require('express').Router());
jest.mock('../../routes/surveyQuizRoutes', () => require('express').Router());
jest.mock('../../routes/surveySessionRoutes', () => require('express').Router());
jest.mock('../../routes/surveyAnswerRoutes', () => require('express').Router());
jest.mock('../../routes/surveyNotificationRoutes', () => require('express').Router());
jest.mock('../../routes/reportRoutes', () => require('express').Router());
jest.mock('../../routes/subscriptionRoutes', () => require('express').Router());
jest.mock('../../routes/surveySlideRoutes', () => require('express').Router());

describe('App Initialization', () => {
    it('should load the app and return a 404 for unknown routes', async () => {
        const res = await request(app).get('/api/unknown');
        expect(res.statusCode).toBe(404);
    });

    it('should have CORS enabled', async () => {
        const res = await request(app).get('/api/auth');
        expect(res.header['access-control-allow-origin']).toBe('*');
    });

    it('should serve static files from the uploads directory', async () => {
        const staticMiddleware = app._router.stack.find(
            (layer) => layer.name === 'serveStatic' && layer.regexp.toString().includes('/uploads')
        );
        expect(staticMiddleware).toBeDefined();
    });
});
