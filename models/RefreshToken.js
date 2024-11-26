const mongoose = require("mongoose");

const RefreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 }, // Token expires after 1 day
});

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);
