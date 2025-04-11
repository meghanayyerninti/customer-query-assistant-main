const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0
  },
  sku: {
    type: String,
    unique: true,
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
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
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add pre-update hook
productSchema.pre('findOneAndUpdate', function(next) {
  console.log('Pre-update hook triggered');
  this.set({ updatedAt: Date.now() });
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;