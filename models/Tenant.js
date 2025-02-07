const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String },
  theme: { type: String, default: 'light' },
  customLogo: { type: String },
  customDomain: { type: String, unique: true },
  mobileNumber: { type: [String] },
  email: { type: [String], unique: true },
  description: { type: String },
  primaryColor: { type: String, default: '#000000' },
  secondaryColor: { type: String, default: '#FFFFFF' }, 
  fontFamily: { type: String, default: 'Arial' }, 
  favicon: { type: String }, 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Tenant', tenantSchema);
