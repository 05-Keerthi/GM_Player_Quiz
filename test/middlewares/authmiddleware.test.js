const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/User');
const BlacklistedToken = require('../../models/BlacklistedToken');
const {
  auth,
  optionalAuth,
  isSuperAdmin,
  isAdmin,
  isTenantAdmin,
  isAdminOrTenantAdmin,
  isGuest,
  isSuperAdminOrTenantAdmin,
  isSuperAdminOrTenantAdminOrAdmin
} = require('../../middlewares/auth');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../models/User');
jest.mock('../../models/BlacklistedToken');

describe('Authentication Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup request mock
    mockReq = {
      header: jest.fn(),
      body: {},
    };

    // Setup response mock
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Setup next function mock
    mockNext = jest.fn();

    // Mock process.env
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('auth middleware', () => {
    it('should return 401 if no token is provided', async () => {
      mockReq.header.mockReturnValue(undefined);

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Access denied. No token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is blacklisted', async () => {
      mockReq.header.mockReturnValue('Bearer validtoken');
      BlacklistedToken.findOne.mockResolvedValue({ token: 'validtoken' });

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Token has been invalidated'
      });
    });

    it('should return 401 if token is invalid', async () => {
      mockReq.header.mockReturnValue('Bearer invalidtoken');
      BlacklistedToken.findOne.mockResolvedValue(null);
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid token'
      });
    });

    it('should return 401 if token is expired', async () => {
      mockReq.header.mockReturnValue('Bearer expiredtoken');
      BlacklistedToken.findOne.mockResolvedValue(null);
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Token has expired'
      });
    });

    it('should return 401 if token type is not access', async () => {
      mockReq.header.mockReturnValue('Bearer validtoken');
      BlacklistedToken.findOne.mockResolvedValue(null);
      jwt.verify.mockReturnValue({ type: 'refresh', id: 'userid' });

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid token type'
      });
    });

    it('should return 401 if user not found', async () => {
      mockReq.header.mockReturnValue('Bearer validtoken');
      BlacklistedToken.findOne.mockResolvedValue(null);
      jwt.verify.mockReturnValue({ type: 'access', id: 'userid' });
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(null)
      });

      await auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });

    it('should set user and token in request if valid token', async () => {
      const mockUser = {
        _id: 'userid',
        email: 'test@example.com',
        role: 'user'
      };

      mockReq.header.mockReturnValue('Bearer validtoken');
      BlacklistedToken.findOne.mockResolvedValue(null);
      jwt.verify.mockReturnValue({ type: 'access', id: 'userid' });
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockUser)
      });

      await auth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBe(mockUser);
      expect(mockReq.token).toBe('validtoken');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Role-based middleware', () => {
    beforeEach(() => {
      mockReq.user = {
        email: 'test@example.com',
        role: 'user'
      };
    });

    describe('isSuperAdmin', () => {
      it('should allow access for superadmin', () => {
        mockReq.user.role = 'superadmin';
        isSuperAdmin(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
      });

      it('should deny access for non-superadmin', () => {
        mockReq.user.role = 'admin';
        isSuperAdmin(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Access denied. Super admin only.'
        });
      });
    });

    describe('isAdminOrTenantAdmin', () => {
      it('should allow access for admin', () => {
        mockReq.user.role = 'admin';
        isAdminOrTenantAdmin(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
      });

      it('should allow access for tenant_admin', () => {
        mockReq.user.role = 'tenant_admin';
        isAdminOrTenantAdmin(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
      });

      it('should deny access for other roles', () => {
        mockReq.user.role = 'user';
        isAdminOrTenantAdmin(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Access denied. Admin or Tenant admin only.'
        });
      });
    });
  });

  describe('optionalAuth middleware', () => {
    it('should skip authentication for guest users', async () => {
      mockReq.body.isGuest = true;
      
      await optionalAuth(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('should proceed with authentication for non-guest users', async () => {
      const mockUser = {
        _id: 'userid',
        email: 'test@example.com',
        role: 'user'
      };

      mockReq.body.isGuest = false;
      mockReq.header.mockReturnValue('Bearer validtoken');
      BlacklistedToken.findOne.mockResolvedValue(null);
      jwt.verify.mockReturnValue({ type: 'access', id: 'userid' });
      User.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockUser)
      });

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBe(mockUser);
      expect(mockReq.token).toBe('validtoken');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});