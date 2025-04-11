const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['return', 'refund', 'shipping', 'privacy', 'terms'],
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before save
policySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Policy = mongoose.model('Policy', policySchema);

module.exports = Policy; 