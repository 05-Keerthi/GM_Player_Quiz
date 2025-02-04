const request = require('supertest');
const express = require('express');
const router = require('../../routes/authRoutes');
const {
  register,
  login,
  refreshToken,
  getProfile,
  logout,
  listUsers,
} = require('../../controllers/authController');

// Mock the controller functions
jest.mock('../../controllers/authController', () => ({
  register: jest.fn(),
  login: jest.fn(),
  refreshToken: jest.fn(),
  getProfile: jest.fn(),
  logout: jest.fn(),
  listUsers: jest.fn(),
}));

// Mock the authentication middleware
jest.mock('../../middlewares/auth', () => {
  const authMock = jest.fn((req, res, next) => next());
  const isAdminOrTenantAdminMock = jest.fn((req, res, next) => next());

  return {
    auth: authMock,
    isAdminOrTenantAdmin: isAdminOrTenantAdminMock,
  };
});

// Create a test app with the router
const app = express();
app.use(express.json());
app.use('/api', router);

describe('AuthRoutes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/auth/register - should call register', async () => {
    register.mockImplementation((req, res) =>
      res.status(201).json({ message: 'User registered successfully' })
    );

    const userData = { username: 'testuser', password: 'password123' };

    const response = await request(app).post('/api/auth/register').send(userData);

    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ body: userData }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User registered successfully');
  });

  test('POST /api/auth/login - should call login', async () => {
    login.mockImplementation((req, res) =>
      res.status(200).json({ token: 'mocked-token' })
    );

    const credentials = { username: 'testuser', password: 'password123' };

    const response = await request(app).post('/api/auth/login').send(credentials);

    expect(login).toHaveBeenCalledWith(
      expect.objectContaining({ body: credentials }),
      expect.any(Object),
      expect.any(Function)
    );
    expect(response.status).toBe(200);
    expect(response.body.token).toBe('mocked-token');
  });

  test('POST /api/auth/refresh-token - should call refreshToken', async () => {
    refreshToken.mockImplementation((req, res) =>
      res.status(200).json({ token: 'new-mocked-token' })
    );

    const response = await request(app).post('/api/auth/refresh-token');

    expect(refreshToken).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.body.token).toBe('new-mocked-token');
  });


  test('POST /api/auth/logout - should call logout', async () => {
    logout.mockImplementation((req, res) =>
      res.status(200).json({ message: 'User logged out successfully' })
    );

    const response = await request(app).post('/api/auth/logout');

    expect(logout).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User logged out successfully');
  });

});
