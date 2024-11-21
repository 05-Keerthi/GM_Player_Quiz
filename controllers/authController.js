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
        message: "username is already registered",
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
      { expiresIn: "1h" }
    );

    res.status(200).json({ token, user });
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

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid Email." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Password." });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.status(200).json({ token, user });
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
