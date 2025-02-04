const jwt = require("jsonwebtoken");

// Generate Access Token - 8 hours expiry
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      type: "access",
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
};

// Generate Refresh Token - 24 hours expiry
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "24h" }
  );
};

// Verify Token with type check
const verifyToken = (token, secret) => {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    throw new Error("Token validation failed");
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
};
