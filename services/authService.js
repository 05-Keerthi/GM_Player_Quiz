const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, tenantId: user.tenantId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};


const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
