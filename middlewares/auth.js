// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const auth = (req, res, next) => {
//   const token = req.header('Authorization')?.replace('Bearer ', '');
//   if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     res.status(400).json({ message: 'Invalid token.' });
//   }
// };

// const protect = async (req, res, next) => {
//   let token;

  
//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//     try {
//       token = req.headers.authorization.split(' ')[1]; 

      
//       const decoded = jwt.verify(token, process.env.JWT_SECRET); 

      
//       req.user = await User.findById(decoded.id).select('-password'); 
//       next(); 
//     } catch (error) {
//       res.status(401).json({ message: 'Not authorized, token failed' });
//     }
//   }

//   if (!token) {
//     res.status(401).json({ message: 'No token provided, authorization denied' });
//   }
// };

// const isSuperAdmin = (req, res, next) => {
//   if (req.user.role !== 'superadmin') {
//     return res.status(403).json({ message: 'Access denied. Super admin only.' });
//   }
//   next();
// };

// const admin = (req, res, next) => {
//   if (req.user && req.user.role === 'admin') {
//     next(); 
//   } else {
//     res.status(403).json({ message: 'Access denied, admin only' });
//   }
// };


// module.exports = { auth, isSuperAdmin, admin, protect };

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const BlacklistedToken = require('../models/BlacklistedToken');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Check if token is blacklisted
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Token has been invalidated.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.log('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token.' });
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

const admin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    console.log(
      `Access denied. User: ${req.user?.email} does not have admin role.`
    );
    return res.status(403).json({ message: "Access denied, admin only" });
  }
  console.log(`Admin access granted to: ${req.user.email}`);
  next();
};

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

module.exports = { auth, isSuperAdmin, admin, isTenantAdmin };
