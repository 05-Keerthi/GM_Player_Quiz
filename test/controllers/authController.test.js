const request = require("supertest");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../../models/User");
const RefreshToken = require("../../models/RefreshToken");
const BlacklistedToken = require("../../models/BlacklistedToken");
const ActivityLog = require("../../models/ActivityLog");
const { sendWelcomeEmail } = require("../../services/mailService");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} = require("../../services/authService");

// Mock the dependencies
jest.mock("../../services/mailService");
jest.mock("bcryptjs");
jest.mock("../../models/User");
jest.mock("../../models/RefreshToken");
jest.mock("../../models/BlacklistedToken");
jest.mock("../../models/ActivityLog");
jest.mock("../../services/authService");

const {
  register,
  login,
  refreshToken,
  getProfile,
  logout,
  listUsers,
} = require("../../controllers/authController");

describe("Auth Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      user: {},
      token: "test-token",
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("register", () => {
    const mockUserData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
      tenantId: "tenant123",
      mobile: "1234567890",
      role: "user",
    };

    it("should register a new user successfully", async () => {
      // Setup
      req.body = mockUserData;

      // Mock User.findOne to return null (no existing user)
      User.findOne.mockResolvedValue(null);

      // Create mock user instance with save method
      const mockUserInstance = {
        _id: "user123",
        ...mockUserData,
        save: jest.fn().mockResolvedValue(undefined),
      };

      // Mock the User constructor to return our mock instance
      User.mockImplementation(() => mockUserInstance);

      generateAccessToken.mockReturnValue("mock-access-token");
      generateRefreshToken.mockReturnValue("mock-refresh-token");
      RefreshToken.prototype.save.mockResolvedValue({});
      sendWelcomeEmail.mockResolvedValue();

      // Execute
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        user: mockUserInstance,
      });
      expect(mockUserInstance.save).toHaveBeenCalled();
      expect(sendWelcomeEmail).toHaveBeenCalledWith(
        mockUserData.email,
        mockUserData.username
      );
    });

    it("should return error if username already exists", async () => {
      // Setup
      req.body = mockUserData;
      User.findOne.mockResolvedValueOnce({ username: mockUserData.username });

      // Execute
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        field: "username",
        message: "Username is already registered",
      });
    });

    it("should handle server errors during registration", async () => {
      // Setup
      req.body = mockUserData;
      User.findOne.mockRejectedValue(new Error("Database error"));

      // Execute
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        field: "general",
        message: "Database error",
      });
    });
  });

  describe("login", () => {
    const mockCredentials = {
      email: "test@example.com",
      password: "password123",
    };

    const mockUser = {
      _id: "user123",
      username: "testuser",
      email: "test@example.com",
      password: "hashedPassword",
      role: "user",
      mobile: "1234567890",
      tenantId: { _id: "tenant123" },
    };

    it("should login user successfully", async () => {
      // Setup
      req.body = mockCredentials;
      User.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      });
      bcrypt.compare.mockResolvedValue(true);
      generateAccessToken.mockReturnValue("mock-access-token");
      generateRefreshToken.mockReturnValue("mock-refresh-token");
      RefreshToken.prototype.save.mockResolvedValue({});
      ActivityLog.prototype.save.mockResolvedValue({});

      // Execute
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        user: {
          id: mockUser._id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
          mobile: mockUser.mobile,
          tenantId: mockUser.tenantId,
        },
      });
    });

    it("should return error for invalid email", async () => {
      // Setup
      req.body = mockCredentials;
      User.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      // Execute
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid Email.",
      });
    });

    it("should return error for invalid password", async () => {
      // Setup
      req.body = mockCredentials;
      User.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      });
      bcrypt.compare.mockResolvedValue(false);

      // Execute
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid Password.",
      });
    });
  });

  describe("refreshToken", () => {
    const mockRefreshTokenPayload = {
      refresh_token: "valid-refresh-token",
    };

    const mockUser = {
      _id: "user123",
      username: "testuser",
      email: "test@example.com",
      role: "user",
      tenantId: "tenant123",
    };

    it("should refresh token successfully", async () => {
      // Setup
      req.body = mockRefreshTokenPayload;
      verifyToken.mockReturnValue({ id: mockUser._id });
      RefreshToken.findOne.mockResolvedValue({
        expiresAt: new Date(),
        save: jest.fn().mockResolvedValue({}),
      });
      User.findById.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue("new-access-token");

      // Execute
      await refreshToken(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: "new-access-token",
        user: {
          id: mockUser._id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
          tenantId: mockUser.tenantId,
        },
      });
    });

    it("should return error for missing refresh token", async () => {
      // Setup
      req.body = {};

      // Execute
      await refreshToken(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Refresh token is required.",
      });
    });
  });

  describe("getProfile", () => {
    it("should return user profile successfully", async () => {
      // Setup
      const mockUser = {
        _id: "user123",
        username: "testuser",
        email: "test@example.com",
      };
      req.user = { id: mockUser._id };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      // Execute
      await getProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it("should handle errors when fetching profile", async () => {
      // Setup
      req.user = { id: "user123" };
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      // Execute
      await getProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Database error",
      });
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      // Setup
      BlacklistedToken.prototype.save.mockResolvedValue({});

      // Execute
      await logout(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Successfully logged out.",
      });
      expect(BlacklistedToken.prototype.save).toHaveBeenCalled();
    });

    it("should handle errors during logout", async () => {
      // Setup
      BlacklistedToken.prototype.save.mockRejectedValue(
        new Error("Database error")
      );

      // Execute
      await logout(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Database error",
      });
    });
  });

  describe("listUsers", () => {
    it("should list all users successfully", async () => {
      // Setup
      const mockUsers = [
        { _id: "user1", username: "user1", email: "user1@example.com" },
        { _id: "user2", username: "user2", email: "user2@example.com" },
      ];
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockUsers),
        }),
      });

      // Execute
      await listUsers(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should handle errors when listing users", async () => {
      // Setup
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error("Database error")),
        }),
      });

      // Execute
      await listUsers(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Database error",
      });
    });
  });
});
