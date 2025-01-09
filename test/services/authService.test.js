const jwt = require('jsonwebtoken');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} = require('../../services/authService');

describe('Authentication Service', () => {
  // Mock user data
  const mockUser = {
    _id: '12345',
    role: 'user'
  };

  // Mock environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret-key',
      JWT_REFRESH_SECRET: 'test-refresh-secret-key'
    };
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateAccessToken', () => {
    it('should generate access token with correct parameters', () => {
      jwt.sign.mockReturnValue('mocked-access-token');

      const token = generateAccessToken(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser._id, role: mockUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      expect(token).toBe('mocked-access-token');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct parameters', () => {
      jwt.sign.mockReturnValue('mocked-refresh-token');

      const token = generateRefreshToken(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser._id, role: mockUser.role },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '1d' }
      );
      expect(token).toBe('mocked-refresh-token');
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', () => {
      const mockDecodedToken = { id: mockUser._id, role: mockUser.role };
      jwt.verify.mockReturnValue(mockDecodedToken);

      const result = verifyToken('valid-token', 'secret');

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'secret');
      expect(result).toEqual(mockDecodedToken);
    });

    it('should throw error when token validation fails', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Token error');
      });

      expect(() => {
        verifyToken('invalid-token', 'secret');
      }).toThrow('Token validation failed.');
    });
  });
});