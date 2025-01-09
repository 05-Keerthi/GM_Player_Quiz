const request = require('supertest');
const express = require('express');
const router = require('../../routes/userRoutes');
const userController = require('../../controllers/userController');

// Mock the middlewares
jest.mock('../../middlewares/auth', () => ({
    auth: jest.fn((req, res, next) => next()),
    isAdminOrTenantAdmin: jest.fn((req, res, next) => next()),
}));

// Mock the userController functions
jest.mock('../../controllers/userController', () => ({
    getAllUsers: jest.fn((req, res) => res.status(200).json({ message: 'All users retrieved successfully' })),
    getUserById: jest.fn((req, res) => res.status(200).json({ message: 'User retrieved successfully' })),
    deleteUser: jest.fn((req, res) => res.status(200).json({ message: 'User deleted successfully' })),
    updateUser: jest.fn((req, res) => res.status(200).json({ message: 'User updated successfully' })),
    changePassword: jest.fn((req, res) => res.status(200).json({ message: 'Password changed successfully' })),
}));

// Import the mocks after defining them
const { auth, isAdminOrTenantAdmin } = require('../../middlewares/auth');

// Set up Express app
const app = express();
app.use(express.json());
app.use('/api', router);

describe('User Routes', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Clear mock call counts after each test
    });

    // Test GET /api/users
    it('should call getAllUsers when a valid GET request is made to /api/users', async () => {
        const res = await request(app).get('/api/users');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
        expect(userController.getAllUsers).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('All users retrieved successfully');
    });

    // Test GET /api/users/:id
    it('should call getUserById when a valid GET request is made to /api/users/:id', async () => {
        const res = await request(app).get('/api/users/1');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
        expect(userController.getUserById).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('User retrieved successfully');
    });

    // Test DELETE /api/users/:id
    it('should call deleteUser when a valid DELETE request is made to /api/users/:id', async () => {
        const res = await request(app).delete('/api/users/1');

        expect(auth).toHaveBeenCalledTimes(1);
        expect(isAdminOrTenantAdmin).toHaveBeenCalledTimes(1);
        expect(userController.deleteUser).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('User deleted successfully');
    });

    // Test PUT /api/users/:id
    it('should call updateUser when a valid PUT request is made to /api/users/:id', async () => {
        const res = await request(app).put('/api/users/1').send({ name: 'Updated User' });

        expect(auth).toHaveBeenCalledTimes(1);
        expect(userController.updateUser).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('User updated successfully');
    });

    // Test POST /api/change-password
    it('should call changePassword when a valid POST request is made to /api/change-password', async () => {
        const res = await request(app).post('/api/change-password').send({
            oldPassword: 'oldpass123',
            newPassword: 'newpass123',
        });

        expect(auth).toHaveBeenCalledTimes(1);
        expect(userController.changePassword).toHaveBeenCalledTimes(1);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Password changed successfully');
    });
});
