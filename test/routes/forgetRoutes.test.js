const request = require('supertest');
const express = require('express');
const router = require('../../routes/forgetRoutes');
const forgetController = require('../../controllers/forgetController');

// Mock the forgetController functions
jest.mock('../../controllers/forgetController', () => ({
    forgotPassword: jest.fn((req, res) => res.status(200).json({ message: 'Password reset email sent' })),
    resetPassword: jest.fn((req, res) => res.status(200).json({ message: 'Password reset successful' })),
    verifyResetCode: jest.fn((req, res) => res.status(200).json({ message: 'Reset code verified' })),
}));

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('Forget Routes', () => {

    // Test POST /api/forgot-password
    it('should call forgotPassword when a valid POST request is made to /api/forgot-password', async () => {
        const res = await request(app)
            .post('/api/forgot-password')
            .send({ email: 'test@example.com' });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Password reset email sent');
        expect(forgetController.forgotPassword).toHaveBeenCalledTimes(1);
    });

    // Test POST /api/reset-password
    it('should call resetPassword when a valid POST request is made to /api/reset-password', async () => {
        const res = await request(app)
            .post('/api/reset-password')
            .send({ email: 'test@example.com', password: 'newpassword123' });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Password reset successful');
        expect(forgetController.resetPassword).toHaveBeenCalledTimes(1);
    });

    // Test POST /api/verify-reset-code
    it('should call verifyResetCode when a valid POST request is made to /api/verify-reset-code', async () => {
        const res = await request(app)
            .post('/api/verify-reset-code')
            .send({ email: 'test@example.com', resetCode: '123456' });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Reset code verified');
        expect(forgetController.verifyResetCode).toHaveBeenCalledTimes(1);
    });
});
