const Tenant = require('../models/Tenant');

const validateTenant = async (req, res, next) => {
  try {
    // Determine the tenant from the request (e.g., customDomain or tenantId)
    const tenantId = req.headers['x-tenant-id']; // Use a header or custom logic to identify the tenant
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }

    // Fetch tenant details from the database
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Attach tenant data to the request object
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = validateTenant;
