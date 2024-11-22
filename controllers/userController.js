const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Helper validation functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateMobileNumber(mobile) {
  const mobileRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return mobileRegex.test(mobile);
}

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ field: "general", message: "Server error", error: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate ID
    if (!id) {
      return res.status(400).json({ field: "id", message: "User ID is required" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ field: "id", message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ field: "general", message: "Server error", error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  const { username, email, mobile, password, role } = req.body;
  const userId = req.params.id;

  try {
    // Validate User ID
    if (!userId) {
      return res.status(400).json({ field: "id", message: "User ID is required" });
    }

    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ field: "id", message: "User not found" });
    }

    // Authorization check
    const isAdmin = req.user.role === "admin";
    const isOwner = user._id.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ field: "authorization", message: "Permission denied" });
    }

    // Validate unique username
    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({
          field: "username",
          message: "Username is already registered",
        });
      }
    }

    // Validate email if provided
    if (email && !validateEmail(email)) {
      return res.status(400).json({ field: "email", message: "Invalid email format" });
    }

    // Validate mobile number if provided
    if (mobile && !validateMobileNumber(mobile)) {
      return res.status(400).json({ field: "mobile", message: "Invalid mobile number" });
    }

    // Validate password if provided
    if (password && password.length < 8) {
      return res
        .status(400)
        .json({ field: "password", message: "Password must be at least 8 characters" });
    }

    // Validate role if provided (admin-only)
    if (role && isAdmin) {
      const validRoles = ["user", "admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ field: "role", message: "Invalid role" });
      }
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (role && isAdmin) user.role = role;

    // Save updated user
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ field: "general", message: "Server error", error: error.message });
  }
};


// Delete user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate ID
    if (!id) {
      return res.status(400).json({ field: "id", message: "User ID is required" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ field: "id", message: "User not found" });
    }

    await user.deleteOne();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ field: "general", message: "Server error", error: error.message });
  }
};
