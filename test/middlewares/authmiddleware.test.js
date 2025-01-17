const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { auth, isSuperAdmin, isAdmin, isTenantAdmin, isAdminOrTenantAdmin, optionalAuth } = require('../../middlewares/auth');

// Mock the required models
jest.mock('../../models/User');
jest.mock('../../models/BlacklistedToken');
const User = require('../../models/User');
const BlacklistedToken = require('../../models/BlacklistedToken');

describe('Authentication Middleware', () => {
  let mockReq;
  let mockRes;
  let nextFunction;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock request object
    mockReq = {
      header: jest.fn(),
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock next function
    nextFunction = jest.fn();

    // Mock process.env
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('auth middleware', () => {
    const validToken = 'valid-token';
    const validUserId = new mongoose.Types.ObjectId();
    
    test('should authenticate valid token and set user', async () => {
      // Mock token in request header
      mockReq.header.mockReturnValue(`Bearer ${validToken}`);

      // Mock jwt.verify
      jwt.verify = jest.fn().mockReturnValue({ id: validUserId });

      // Mock BlacklistedToken.findOne
      BlacklistedToken.findOne.mockResolvedValue(null);

      // Mock User.findById
      const mockUser = { _id: validUserId, email: 'test@example.com' };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await auth(mockReq, mockRes, nextFunction);

      expect(mockReq.user).toEqual(mockUser);
      expect(mockReq.token).toBe(validToken);
      expect(nextFunction).toHaveBeenCalled();
    });

    test('should return 401 when no token provided', async () => {
      mockReq.header.mockReturnValue(null);

      await auth(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Access denied. No token provided.'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    test('should return 401 when token is blacklisted', async () => {
      mockReq.header.mockReturnValue(`Bearer ${validToken}`);
      BlacklistedToken.findOne.mockResolvedValue({ token: validToken });

      await auth(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Token has been invalidated.'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    test('should return 401 when user not found', async () => {
      mockReq.header.mockReturnValue(`Bearer ${validToken}`);
      jwt.verify = jest.fn().mockReturnValue({ id: validUserId });
      BlacklistedToken.findOne.mockResolvedValue(null);
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await auth(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User not found.'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    test('should return 401 when token is invalid', async () => {
      mockReq.header.mockReturnValue(`Bearer invalid-token`);
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await auth(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid or expired token.'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Role-based middleware', () => {
    beforeEach(() => {
      mockReq.user = {
        email: 'test@example.com'
      };
    });

    describe('isSuperAdmin middleware', () => {
      test('should allow superadmin access', () => {
        mockReq.user.role = 'superadmin';
        
        isSuperAdmin(mockReq, mockRes, nextFunction);
        
        expect(nextFunction).toHaveBeenCalled();
      });

      test('should deny non-superadmin access', () => {
        mockReq.user.role = 'admin';
        
        isSuperAdmin(mockReq, mockRes, nextFunction);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Access denied. Super admin only.'
        });
      });
    });

    describe('isAdminOrTenantAdmin middleware', () => {
      test('should allow admin access', () => {
        mockReq.user.role = 'admin';
        
        isAdminOrTenantAdmin(mockReq, mockRes, nextFunction);
        
        expect(nextFunction).toHaveBeenCalled();
      });

      test('should allow tenant_admin access', () => {
        mockReq.user.role = 'tenant_admin';
        
        isAdminOrTenantAdmin(mockReq, mockRes, nextFunction);
        
        expect(nextFunction).toHaveBeenCalled();
      });

      test('should deny other roles', () => {
        mockReq.user.role = 'user';
        
        isAdminOrTenantAdmin(mockReq, mockRes, nextFunction);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Access denied. Admin or Tenant admin only.'
        });
      });
    });

    describe('isTenantAdmin middleware', () => {
      test('should allow tenant_admin access', () => {
        mockReq.user.role = 'tenant_admin';
        
        isTenantAdmin(mockReq, mockRes, nextFunction);
        
        expect(nextFunction).toHaveBeenCalled();
      });

      test('should deny non-tenant_admin access', () => {
        mockReq.user.role = 'admin';
        
        isTenantAdmin(mockReq, mockRes, nextFunction);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Access denied. Tenant admin only.'
        });
      });
    });

    describe('isAdmin middleware', () => {
      test('should allow admin access', () => {
        mockReq.user.role = 'admin';
        
        isAdmin(mockReq, mockRes, nextFunction);
        
        expect(nextFunction).toHaveBeenCalled();
      });

      test('should deny non-admin access', () => {
        mockReq.user.role = 'user';
        
        isAdmin(mockReq, mockRes, nextFunction);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Access denied. Admin only.'
        });
      });
    });

    describe('optionalAuth middleware', () => {
      test('should allow guest access if isGuest is true', async () => {
        mockReq.body = { isGuest: true };
    
        await optionalAuth(mockReq, mockRes, nextFunction);
    
        expect(nextFunction).toHaveBeenCalled();
      });
    
      test('should authenticate user if isGuest is false', async () => {
        const validToken = 'valid-token';
        const validUserId = new mongoose.Types.ObjectId();
        mockReq.header.mockReturnValue(`Bearer ${validToken}`);
        mockReq.body = { isGuest: false };
    
        jwt.verify = jest.fn().mockReturnValue({ id: validUserId });
        BlacklistedToken.findOne.mockResolvedValue(null);
        const mockUser = { _id: validUserId, email: 'test@example.com' };
        User.findById.mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUser),
        });
    
        await optionalAuth(mockReq, mockRes, nextFunction);
    
        expect(mockReq.user).toEqual(mockUser);
        expect(nextFunction).toHaveBeenCalled();
      });
    
      test('should return 401 if token is missing for authenticated user', async () => {
        mockReq.body = { isGuest: false };
        mockReq.header.mockReturnValue(null);
    
        await optionalAuth(mockReq, mockRes, nextFunction);
    
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({
          message: 'Access denied. No token provided.',
        });
        expect(nextFunction).not.toHaveBeenCalled();
      });
    });
  });
});