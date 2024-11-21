const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'admin', 'superadmin'], required: false, default: 'user'},
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: false },
  createdAt: { type: Date, default: Date.now },
  resetPasswordCode: { type: String },
  resetPasswordExpires: { type: Date }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
