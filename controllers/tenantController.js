const Tenant = require('../models/Tenant');

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
  getAllTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
};
