const request = require("supertest");
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const { sendPasswordChangeEmail } = require("../../services/mailService");

// Mock dependencies
jest.mock("bcryptjs");
jest.mock("../../models/User");
jest.mock("../../services/mailService");

const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
} = require("../../controllers/userController");

describe("User Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: {
        _id: "user123",
        role: "user",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("getAllUsers", () => {
    const mockUsers = [
      {
        _id: "user1",
        username: "user1",
        email: "user1@example.com",
        role: "user",
        tenantId: { _id: "tenant1", name: "Tenant 1" },
      },
      {
        _id: "user2",
        username: "user2",
        email: "user2@example.com",
        role: "admin",
        tenantId: { _id: "tenant1", name: "Tenant 1" },
      },
    ];

    it("should return all users successfully", async () => {
      // Setup
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockUsers),
        }),
      });

      // Execute
      await getAllUsers(req, res);

      // Assert
      expect(User.find).toHaveBeenCalledWith({ role: { $in: ["user", "admin"] } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should handle database errors", async () => {
      // Setup
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error("Database error")),
        }),
      });

      // Execute
      await getAllUsers(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Database error",
      });
    });
  });

  describe("getUserById", () => {
    const mockUser = {
      _id: "user123",
      username: "testuser",
      email: "test@example.com",
      tenantId: { _id: "tenant1", name: "Tenant 1" },
    };

    it("should return user by ID successfully", async () => {
      // Setup
      req.params.id = "user123";
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      });

      // Execute
      await getUserById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return 404 if user not found", async () => {
      // Setup
      req.params.id = "nonexistent";
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      // Execute
      await getUserById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        field: "id",
        message: "User not found",
      });
    });

    it("should return 400 if ID is missing", async () => {
      // Setup
      req.params = {};

      // Execute
      await getUserById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        field: "id",
        message: "User ID is required",
      });
    });
  });

  describe("updateUser", () => {
    const mockUser = {
      _id: "user123",
      username: "testuser",
      email: "test@example.com",
      mobile: "1234567890",
      role: "user",
      tenantId: { _id: "tenant1", name: "Tenant 1" },
      save: jest.fn(),
    };

    beforeEach(() => {
      mockUser.save.mockResolvedValue(mockUser);
    });

    it("should update user successfully as owner", async () => {
      // Setup
      req.params.id = "user123";
      req.body = {
        username: "newusername",
        email: "newemail@example.com",
        mobile: "9876543210",
      };
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      });
      User.findOne.mockResolvedValue(null);

      // Execute
      await updateUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Profile updated successfully",
        user: expect.objectContaining({
          _id: mockUser._id,
          username: req.body.username,
          email: req.body.email,
          mobile: req.body.mobile,
        }),
      });
    });

    it("should prevent unauthorized updates", async () => {
      // Setup
      req.params.id = "other123";
      req.user._id = "different123";
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockUser,
          _id: "other123",
        }),
      });

      // Execute
      await updateUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        field: "authorization",
        message: "Permission denied",
      });
    });

    it("should validate email format", async () => {
      // Setup
      req.params.id = "user123";
      req.body = {
        email: "invalid-email",
      };
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      });

      // Execute
      await updateUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        field: "email",
        message: "Invalid email format",
      });
    });
  });

  describe("deleteUser", () => {
    const mockUser = {
      _id: "user123",
      username: "testuser",
      deleteOne: jest.fn(),
    };

    it("should delete user successfully", async () => {
      // Setup
      req.params.id = "user123";
      mockUser.deleteOne.mockResolvedValue({});
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser),
      });

      // Execute
      await deleteUser(req, res);

      // Assert
      expect(mockUser.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "User deleted successfully",
      });
    });

    it("should return 404 if user not found", async () => {
      // Setup
      req.params.id = "nonexistent";
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      // Execute
      await deleteUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        field: "id",
        message: "User not found",
      });
    });
  });

  describe("changePassword", () => {
    const mockUser = {
      _id: "user123",
      email: "test@example.com",
      username: "testuser",
      password: "hashedOldPassword",
      save: jest.fn(),
    };

    it("should change password successfully", async () => {
      // Setup
      req.body = {
        oldPassword: "oldPassword123",
        newPassword: "newPassword123",
      };
      req.user.id = "user123";

      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      mockUser.save.mockResolvedValue(mockUser);
      sendPasswordChangeEmail.mockResolvedValue();

      // Execute
      await changePassword(req, res);

      // Assert
      expect(mockUser.save).toHaveBeenCalled();
      expect(sendPasswordChangeEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.username
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Password updated successfully.",
      });
    });

    it("should return 400 if old password is incorrect", async () => {
      // Setup
      req.body = {
        oldPassword: "wrongPassword",
        newPassword: "newPassword123",
      };
      req.user.id = "user123";

      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      // Execute
      await changePassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Old password is incorrect.",
      });
    });

    it("should return 400 if passwords are missing", async () => {
      // Setup
      req.body = {};
      req.user.id = "user123";

      // Execute
      await changePassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Both old and new passwords are required.",
      });
    });
  });
});