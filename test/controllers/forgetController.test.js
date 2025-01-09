const User = require('../../models/User');
const mailService = require('../../services/mailService');
const { 
  forgotPassword,
  verifyResetCode,
  resetPassword 
} = require('../../controllers/forgetController');

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../services/mailService');

describe('Forget Password Controller', () => {
  let req;
  let res;
  
  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('forgotPassword', () => {
    const mockEmail = 'test@example.com';

    it('should send reset code successfully', async () => {
      // Setup
      req.body = { email: mockEmail };
      const mockUser = {
        email: mockEmail,
        save: jest.fn().mockResolvedValue(undefined)
      };

      User.findOne.mockResolvedValue(mockUser);
      mailService.sendResetCode.mockResolvedValue(undefined);

      // Execute
      await forgotPassword(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: mockEmail });
      expect(mockUser.save).toHaveBeenCalled();
      expect(mailService.sendResetCode).toHaveBeenCalledWith(
        mockEmail,
        expect.any(String)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Reset code sent to email'
      });
    });

    it('should return error if user not found', async () => {
      // Setup
      req.body = { email: mockEmail };
      User.findOne.mockResolvedValue(null);

      // Execute
      await forgotPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });

    it('should handle server errors', async () => {
      // Setup
      req.body = { email: mockEmail };
      const mockError = new Error('Database error');
      User.findOne.mockRejectedValue(mockError);

      // Execute
      await forgotPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: mockError.message
      });
    });
  });

  describe('verifyResetCode', () => {
    const mockData = {
      email: 'test@example.com',
      resetCode: '123456'
    };

    it('should verify reset code successfully', async () => {
      // Setup
      req.body = mockData;
      User.findOne.mockResolvedValue({
        email: mockData.email,
        resetPasswordCode: mockData.resetCode
      });

      // Execute
      await verifyResetCode(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({
        email: mockData.email,
        resetPasswordCode: mockData.resetCode,
        resetPasswordExpires: { $gt: expect.any(Number) }
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Reset code is valid'
      });
    });

    it('should return error for invalid reset code', async () => {
      // Setup
      req.body = mockData;
      User.findOne.mockResolvedValue(null);

      // Execute
      await verifyResetCode(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid or expired reset code'
      });
    });

    it('should handle server errors', async () => {
      // Setup
      req.body = mockData;
      const mockError = new Error('Database error');
      User.findOne.mockRejectedValue(mockError);

      // Execute
      await verifyResetCode(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: mockError.message
      });
    });
  });

  describe('resetPassword', () => {
    const mockData = {
      resetCode: '123456',
      newPassword: 'newPassword123'
    };

    it('should reset password successfully', async () => {
      // Setup
      req.body = mockData;
      const mockUser = {
        email: 'test@example.com',
        username: 'testuser',
        save: jest.fn().mockResolvedValue(undefined)
      };

      User.findOne.mockResolvedValue(mockUser);
      mailService.sendPasswordResetConfirmation.mockResolvedValue(undefined);

      // Execute
      await resetPassword(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({
        resetPasswordCode: mockData.resetCode,
        resetPasswordExpires: { $gt: expect.any(Number) }
      });
      expect(mockUser.save).toHaveBeenCalled();
      expect(mailService.sendPasswordResetConfirmation).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.username
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset successful. Confirmation email sent.'
      });
    });

    it('should return error for invalid reset code', async () => {
      // Setup
      req.body = mockData;
      User.findOne.mockResolvedValue(null);

      // Execute
      await resetPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid or expired reset code'
      });
    });

    it('should handle server errors', async () => {
      // Setup
      req.body = mockData;
      const mockError = new Error('Database error');
      User.findOne.mockRejectedValue(mockError);

      // Execute
      await resetPassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: mockError.message
      });
    });
  });
});