const Tenant = require('../models/Tenant');

const createTenant = async (req, res) => {
  try {
    const newTenant = new Tenant(req.body);
    await newTenant.save();
    res.status(200).json(newTenant);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    const updatedTenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTenant) return res.status(404).json({ message: 'Tenant not found' });
    res.status(200).json(updatedTenant);
  } catch (error) {
    res.status(400).json({ message: error.message });
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

module.exports = {
  createTenant,
  getAllTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
};
