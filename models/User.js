const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function () {
      return !this.isGuest;
    },
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ["user", "admin", "superadmin", "tenant_admin"],
    required: false,
    default: "user", // Changed to always default to "user"
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: false,
  },
  // Guest flag to identify guest users
  isGuest: {
    type: Boolean,
    default: false,
  },
  guestExpiryDate: {
    type: Date,
    required: function () {
      return this.isGuest;
    },
  },
  surveyParticipations: [
    {
      sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SurveySession",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordCode: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
});

// Index for guest expiry cleanup
userSchema.index({ guestExpiryDate: 1 }, { expireAfterSeconds: 0 });

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isGuest && this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to check if guest account has expired
userSchema.methods.isGuestExpired = function () {
  if (!this.isGuest) return false;
  return this.guestExpiryDate < new Date();
};

// Method to convert guest to regular user
userSchema.methods.convertToRegularUser = async function (password) {
  this.isGuest = false;
  this.password = password;
  this.guestExpiryDate = undefined;
  await this.save();
};

// Static method to clean up expired guests
userSchema.statics.cleanupExpiredGuests = async function () {
  const currentDate = new Date();
  await this.deleteMany({
    isGuest: true,
    guestExpiryDate: { $lt: currentDate },
  });
};

module.exports = mongoose.model("User", userSchema);
