const User = require('../models/User');


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// exports.updateUser = async (req, res) => {
//   const { username, email, mobile, password, role } = req.body;

//   try {
//     // Find the user by ID
//     const user = await User.findById(req.params.id);

//     // Check if the user exists
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Allow only the user themselves or an admin to update the profile
//     if (user._id.toString() !== req.user._id && req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'Permission denied' });
//     }

//     // Update fields if provided in the request body
//     user.username = username || user.username;
//     user.email = email || user.email;
//     user.mobile = mobile || user.mobile;

//     // If password is provided, hash it before saving
//     if (password) {
//       user.password = await bcrypt.hash(password, 10);
//     }

//     // Allow role update only if the requester is an admin
//     if (role && req.user.role === 'admin') {
//       user.role = role;
//     }

//     // Save the updated user document
//     await user.save();

//     // Return success response with updated user information (excluding sensitive data)
//     res.status(200).json({
//       message: 'User updated successfully',
//       user: {
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         mobile: user.mobile,
//         role: user.role,
//         createdAt: user.createdAt,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };


exports.updateUser = async (req, res) => {
  const { username, email, mobile, password, role } = req.body;
  const userId = req.params.id;

  try {
    // Input validation
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find the user by ID
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Authorization check
    const isAdmin = req.user.role === "admin";
    const isOwner = user._id.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Validate email if provided
    if (email && !validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate mobile number if provided
    if (mobile && !validateMobileNumber(mobile)) {
      return res.status(400).json({ message: "Invalid mobile number" });
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;

    // Password update with additional validation
    if (password) {
      if (password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters" });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    // Role update (admin-only)
    if (role && isAdmin) {
      const validRoles = ["user", "admin", "moderator"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      user.role = role;
    }

    // Save updated user
    await user.save();

    // Prepare response (exclude sensitive data)
    const updatedUserResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUserResponse,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Helper validation functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateMobileNumber(mobile) {
  const mobileRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return mobileRegex.test(mobile);
}

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    
    await user.deleteOne();

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
