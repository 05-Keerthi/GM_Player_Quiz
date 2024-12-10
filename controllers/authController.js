const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendWelcomeEmail } = require("../services/mailService");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} = require("../services/authService");
const RefreshToken = require("../models/RefreshToken");
const BlacklistedToken = require("../models/BlacklistedToken");
const ActivityLog = require("../models/ActivityLog");

// Register a new user
const register = async (req, res) => {
  try {
    const { username, email, password, tenantId, mobile, role } = req.body;

    // Check username, email, and mobile existence
    if (await User.findOne({ username })) {
      return res
        .status(400)
        .json({ field: "username", message: "Username is already registered" });
    }
    if (await User.findOne({ email })) {
      return res
        .status(400)
        .json({ field: "email", message: "Email is already registered" });
    }
    if (await User.findOne({ mobile })) {
      return res
        .status(400)
        .json({
          field: "mobile",
          message: "Phone number is already registered",
        });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      tenantId,
      mobile,
      role,
    });
    await user.save();

    // Generate tokens
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    const refreshTokenInstance = new RefreshToken({
      token: refreshToken,
      userId: user._id,
    });
    await refreshTokenInstance.save();

    // Send Welcome Email
    await sendWelcomeEmail(email, username);

    res.status(200).json({ token, refresh_token: refreshToken, user });
  } catch (error) {
    res.status(500).json({ field: "general", message: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email }).populate("tenantId");

    if (!existingUser) {
      return res.status(400).json({ message: "Invalid Email." });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password." });
    }

    const token = generateAccessToken(existingUser);
    const refreshToken = generateRefreshToken(existingUser);

    // Store refresh token
    const refreshTokenInstance = new RefreshToken({
      token: refreshToken,
      userId: existingUser._id,
    });
    await refreshTokenInstance.save();

    // Log the activity
    const activityLog = new ActivityLog({
      user: existingUser._id,
      activityType: "login",
      details: {
        ip: req.ip, // Optionally log IP address
      },
    });
    await activityLog.save();

    res.status(200).json({
      token,
      refresh_token: refreshToken,
      user: {
        id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        role: existingUser.role,
        tenantId: existingUser.tenantId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ message: "Refresh token is required." });
    }

    // Verify the refresh token
    const payload = verifyToken(refresh_token, process.env.JWT_REFRESH_SECRET);

    // Check if the token exists in the database
    const storedToken = await RefreshToken.findOne({ token: refresh_token });
    if (!storedToken) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token." });
    }

    // Fetch the user to get the latest details
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    // Generate a new access token
    const newAccessToken = generateAccessToken(user);

    // Optionally, update the refresh token in the database (if rotation is required)
    storedToken.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Extend expiry time
    await storedToken.save();

    res.status(200).json({
      token: newAccessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (error) {
    res.status(401).json({ message: "Token validation failed." });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    // Add the current token to blacklist
    const blacklistedToken = new BlacklistedToken({
      token: req.token,
    });
    await blacklistedToken.save();

    res.status(200).json({ message: "Successfully logged out." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password") // Exclude passwords from the response
      .populate("tenantId"); // Populate tenantId field with tenant details

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getProfile,
  logout,
  listUsers,
};
