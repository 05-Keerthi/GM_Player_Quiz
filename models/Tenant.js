const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema({
  // Required fields
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  customDomain: {
    type: String,
    required: [true, "Domain is required"],
    unique: true,
  },
  mobileNumber: {
    type: [String],
    required: [true, "At least one mobile number is required"],
    validate: {
      validator: function (v) {
        return v.length > 0;
      },
      message: "At least one mobile number is required",
    },
  },
  email: {
    type: [String],
    required: [true, "At least one email is required"],
    validate: {
      validator: function (v) {
        return v.length > 0;
      },
      message: "At least one email is required",
    },
  },

  // Optional fields
  logo: { type: String },
  theme: { type: String, default: "light" },
  customLogo: { type: String },
  customDomain: { type: String, unique: true },
  mobileNumber: { type: [String] },
  email: { type: [String], unique: true },
  description: { type: String },
  primaryColor: { type: String, default: "#000000" },
  secondaryColor: { type: String, default: "#FFFFFF" },
  fontFamily: { type: String, default: "Arial" },
  favicon: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Tenant", tenantSchema);
