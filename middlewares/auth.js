const jwt = require("jsonwebtoken");
const User = require("../models/User");
const BlacklistedToken = require("../models/BlacklistedToken");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    // Check if token is blacklisted
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({ message: "Token has been invalidated." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.log("Authentication error:", error);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

const isSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "superadmin") {
    console.log(
      `Access denied. User: ${req.user?.email} does not have superadmin role.`
    );
    return res
      .status(403)
      .json({ message: "Access denied. Super admin only." });
  }
  console.log(`SuperAdmin access granted to: ${req.user.email}`);
  next();
};

// Combined middleware for both admin and tenant_admin roles
const isAdminOrTenantAdmin = (req, res, next) => {
  if (
    !req.user ||
    (req.user.role !== "admin" && req.user.role !== "tenant_admin")
  ) {
    console.log(
      `Access denied. User: ${req.user?.email} does not have admin or tenant_admin role.`
    );
    return res
      .status(403)
      .json({ message: "Access denied. Admin or Tenant admin only." });
  }
  console.log(`Admin/TenantAdmin access granted to: ${req.user.email}`);
  next();
};

// Individual role middlewares if needed
const isTenantAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "tenant_admin") {
    console.log(
      `Access denied. User: ${req.user?.email} does not have tenantAdmin role.`
    );
    return res
      .status(403)
      .json({ message: "Access denied. Tenant admin only." });
  }
  console.log(`TenantAdmin access granted to: ${req.user.email}`);
  next();
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    console.log(
      `Access denied. User: ${req.user?.email} does not have admin role.`
    );
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  console.log(`Admin access granted to: ${req.user.email}`);
  next();
};

module.exports = {
  auth,
  isSuperAdmin,
  isAdmin,
  isTenantAdmin,
  isAdminOrTenantAdmin,
};