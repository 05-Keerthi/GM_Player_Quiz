const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { sendInviteEmail } = require('../services/mailService');
const crypto = require('crypto');

const createTenant = async (req, res) => {
  try {
    // Check if custom domain exists if provided
    if (req.body.customDomain) {
      const existingTenant = await Tenant.findOne({ customDomain: req.body.customDomain });
      if (existingTenant) {
        return res.status(400).json({
          message: 'Validation Error',
          errors: [{ field: 'customDomain', message: 'Custom domain already exists' }]
        });
      }
    }

    const newTenant = new Tenant(req.body);
    await newTenant.save();
    res.status(201).json(newTenant);
  } catch (error) {
    handleError(res, error);
  }
};

const registerTenantAdmin = async (req, res) => {
  try {
    const tenantId = req.params.id;

    // Ensure that the current user is a super admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Forbidden: Only super admin can create a tenant admin' });
    }

    // Check if the tenant ID exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const { username, email, mobile } = req.body;
    const existingUser = await User.findOne({
      $or: [{ username }, { email }, { mobile }],
    });

    if (existingUser) {
      const errors = [];
      if (existingUser.username === username) {
        errors.push({ field: 'username', message: 'Username already taken' });
      }
      if (existingUser.email === email) {
        errors.push({ field: 'email', message: 'Email already registered' });
      }
      if (existingUser.mobile === mobile) {
        errors.push({ field: 'mobile', message: 'Mobile number already registered' });
      }

      return res.status(400).json({
        message: 'Validation Error',
        errors,
      });
    }

    // Create the tenant admin
    const newAdmin = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password, // Ensure you hash the password before saving it
      mobile: req.body.mobile,
      role: req.body.role, // Fixed role as tenant admin
      tenantId: tenantId, // Assign the tenant ID
    });

    await newAdmin.save();

    // Send an invitation email to the tenant admin
    await sendInviteEmail(
      newAdmin.email,
      tenant.name,
      `${process.env.FRONTEND_URL}/login`, // Example invitation link
      {
        username: newAdmin.username,
        email: newAdmin.email,
        password: req.body.password, // Send plain password (ensure it’s temporary)
      }
    );

    res.status(201).json({ message: 'Tenant admin created successfully', user: newAdmin });
  } catch (error) {
    handleError(res, error);
  }
};

const updateTenantAdmin = async (req, res) => {
  try {
    const tenantId = req.params.id;
    const userId = req.params.userId;

    // Ensure that the current user is a super admin or a tenant admin
    if (req.user.role !== 'superadmin' && req.user.role !== 'tenant_admin') {
      return res.status(403).json({ message: 'Forbidden: Only super admin or tenant admin can update tenant admin details' });
    }

    // Check if the tenant ID exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if the user exists
    const user = await User.findOne({ _id: userId, tenantId: tenantId });
    if (!user) {
      return res.status(404).json({ message: 'User not found for the given tenant' });
    }

    // Update only allowed fields
    const updates = {};
    const allowedFields = ['username', 'email', 'mobile', 'password', 'role']; // Add fields you want to allow
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // If password is being updated, ensure it is hashed
    if (updates.password) {
      updates.password = await hashPassword(updates.password); // Replace with your hashing logic
    }

    // Perform the update
    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });

    res.status(200).json({
      message: 'Tenant admin updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    handleError(res, error);
  }
};

const getTenantAdmins = async (req, res) => {
  try {
    const tenantId = req.params.id;

    // SuperAdmin can view all tenant admins; tenantAdmin can view their own
    if (req.user.role === 'tenant_admin' && req.user.tenantId !== tenantId) {
      return res
        .status(403)
        .json({ message: 'Access denied. You can only view your own tenant users.' });
    }

    // Find tenant admins for the given tenant ID
    const tenantAdmins = await User.find({ tenantId: tenantId, role: 'tenant_admin' });

    if (!tenantAdmins) {
      return res.status(404).json({ message: 'No tenant admins found for this tenant.' });
    }

    res.status(200).json(tenantAdmins);
  } catch (error) {
    console.error('Error retrieving tenant admins:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTenantAdmin = async (req, res) => {
  try {
    const tenantId = req.params.id;
    const userId = req.params.userId;

    // Ensure that the current user is a super admin or tenant admin
    if (req.user.role !== 'superadmin' && req.user.role !== 'tenant_admin') {
      return res.status(403).json({
        message: 'Forbidden: Only super admin or tenant admin can delete tenant admin details',
      });
    }

    // Check if the tenant ID exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Check if the user exists and belongs to the correct tenant
    const user = await User.findOne({ _id: userId, tenantId: tenantId });
    if (!user) {
      return res.status(404).json({ message: 'User not found for the given tenant' });
    }

    // If the current user is not a super admin and is trying to delete their own account, prevent it
    if (req.user.role === 'tenant_admin' && req.user._id.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Tenant admin cannot delete themselves' });
    }

    // Perform the delete operation
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: 'Tenant admin deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tenant admin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find();
    res.status(200).json(tenants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });
    res.status(200).json(tenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTenant = async (req, res) => {
  try {
    // Check if custom domain is being updated
    if (req.body.customDomain) {
      const existingTenant = await Tenant.findOne({
        customDomain: req.body.customDomain,
        _id: { $ne: req.params.id } // Exclude current tenant from check
      });
      
      if (existingTenant) {
        return res.status(400).json({
          message: 'Validation Error',
          errors: [{ field: 'customDomain', message: 'Custom domain already exists' }]
        });
      }
    }

    const updatedTenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedTenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    res.status(200).json(updatedTenant);
  } catch (error) {
    handleError(res, error);
  }
};

const deleteTenant = async (req, res) => {
  try {
    const deletedTenant = await Tenant.findByIdAndDelete(req.params.id);
    if (!deletedTenant) return res.status(404).json({ message: 'Tenant not found' });
    res.status(200).json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const handleError = (res, error) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  console.error('Server Error:', error);
  return res.status(500).json({
    message: 'Internal server error'
  });
};

module.exports = {
  createTenant,
  registerTenantAdmin,
  updateTenantAdmin,
  getTenantAdmins,
  deleteTenantAdmin,
  getAllTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
};
