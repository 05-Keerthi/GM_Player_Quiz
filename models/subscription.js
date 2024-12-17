const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planType: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  paymentDetails: {
    paymentMethod: { type: String },
    amountPaid: { type: Number },
    currency: { type: String, default: 'USD' },
    transactionId: { type: String },
  },
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
