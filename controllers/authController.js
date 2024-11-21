const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const register = async (req, res) => {
  try {
    const { username, email, password, tenantId, mobile, role } = req.body;

    // Check username existence separately
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        field: "username",
        message: "Username is already registered",
      });
    }
    // Check email existence separately
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        field: "email",
        message: "Email is already registered",
      });
    }

    // Check mobile existence separately
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({
        field: "mobile",
        message: "Phone number is already registered",
      });
    }

    // Create new user if no conflicts
    // const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password,
      tenantId,
      mobile,
      role,
    });
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    const refreshToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ token, refresh_token: refreshToken, user });
  } catch (error) {
    res.status(500).json({
      field: "general",
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (!existingUser)
      return res.status(400).json({ message: "Invalid Email." });

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password." });

    const token = jwt.sign(
      { id: existingUser._id, role: existingUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    const refreshToken = jwt.sign(
      { id: existingUser._id, role: existingUser.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      refresh_token: refreshToken,
      user: {
        id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        role: existingUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

const logout = (req, res) => {
  try {
    res.status(200).json({ message: "Successfully logged out." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listUsers = async (req, res) => {
  try {
    // Filter users to return only those with role "user"
    const users = await User.find({ role: "user" }).select("-password"); // Exclude passwords from the response
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getProfile, logout, listUsers };
