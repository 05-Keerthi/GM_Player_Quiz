const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');
const BlacklistedToken = require('../../models/BlacklistedToken');
const ActivityLog = require('../../models/ActivityLog');
const { sendWelcomeEmail } = require('../../services/mailService');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} = require('../../services/authService');

// Mock all dependencies
jest.mock('../../models/User');
jest.mock('../../models/RefreshToken');
jest.mock('../../models/BlacklistedToken');
jest.mock('../../models/ActivityLog');
jest.mock('../../services/mailService');
jest.mock('../../services/authService');
jest.mock('bcryptjs');

const {
  register,
  login,
  refreshToken,
  logout
} = require('../../controllers/authController');

describe('Auth Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      token: 'mock-token'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      tenantId: 'tenant123',
      mobile: '1234567890',
      role: 'user'
    };

    it('should register a new user successfully', async () => {
      // Setup
      req.body = mockUserData;
      
      User.findOne.mockResolvedValue(null);
      
      const mockUser = {
        ...mockUserData,
        _id: 'user123',
        save: jest.fn().mockResolvedValue(undefined)
      };

      User.mockImplementation(() => mockUser);
      RefreshToken.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(undefined)
      }));

      generateAccessToken.mockReturnValue('mock-access-token');
      generateRefreshToken.mockReturnValue('mock-refresh-token');
      sendWelcomeEmail.mockResolvedValue(undefined);

      // Execute
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: expect.objectContaining({
          username: mockUserData.username
        })
      });
    });

    it('should return error if username already exists', async () => {
      // Setup
      req.body = mockUserData;
      User.findOne.mockImplementation((query) => {
        if (query.username) return Promise.resolve({ username: 'testuser' });
        return Promise.resolve(null);
      });

      // Execute
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        field: 'username',
        message: 'Username is already registered'
      });
    });
  });

  describe('login', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login user successfully', async () => {
      // Setup
      req.body = mockCredentials;
      
      const mockUser = {
        _id: 'user123',
        email: mockCredentials.email,
        password: 'hashedPassword',
        username: 'testuser',
        role: 'user'
      };

      User.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });

      bcrypt.compare.mockResolvedValue(true);
      generateAccessToken.mockReturnValue('mock-access-token');
      generateRefreshToken.mockReturnValue('mock-refresh-token');

      RefreshToken.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(undefined)
      }));

      ActivityLog.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(undefined)
      }));

      // Execute
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: expect.objectContaining({
          email: mockCredentials.email
        })
      });
    });

    it('should return error for invalid email', async () => {
      // Setup
      req.body = mockCredentials;
      User.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid email'
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Setup
      req.body = { refresh_token: 'valid-refresh-token' };
      
      verifyToken.mockReturnValue({
        id: 'user123',
        type: 'refresh'
      });

      BlacklistedToken.findOne.mockResolvedValue(null);
      RefreshToken.findOne.mockResolvedValue({
        _id: 'token123',
        token: 'valid-refresh-token'
      });

      User.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue({
          _id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user'
        })
      });

      generateAccessToken.mockReturnValue('new-access-token');
      generateRefreshToken.mockReturnValue('new-refresh-token');

      // Execute
      await refreshToken(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        user: expect.objectContaining({
          id: 'user123'
        })
      });
    });

    it('should return error for missing refresh token', async () => {
      // Setup
      req.body = {};

      // Execute
      await refreshToken(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Refresh token is required'
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Setup
      BlacklistedToken.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(undefined)
      }));

      // Execute
      await logout(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Successfully logged out.'
      });
    });

    it('should handle logout error', async () => {
      // Setup
      BlacklistedToken.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      }));

      // Execute
      await logout(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Database error'
      });
    });
  });
});