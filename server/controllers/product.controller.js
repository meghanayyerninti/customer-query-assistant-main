const Product = require('../models/product.model');

const getAllProducts = async (req, res) => {
  try {
    console.log('Fetching all products...');
    console.log('Request headers:', req.headers);
    const products = await Product.find();
    console.log(`Found ${products.length} products`);
    console.log('Products:', JSON.stringify(products, null, 2));
    res.status(200).json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch products', 
      error: error.message 
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json({ product });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch product', 
      error: error.message 
    });
  }
};

const createProduct = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { name, description, price, category, inStock, stockQuantity, sku, imageUrl } = req.body;
    
    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with that SKU already exists' });
    }
    
    const product = new Product({
      name,
      description,
      price,
      category,
      inStock,
      stockQuantity,
      sku,
      imageUrl
    });
    
    await product.save();
    
    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create product', 
      error: error.message 
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    console.log('Update product request:', {
      productId: req.params.productId,
      updates: req.body,
      user: req.user
    });

    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('Access denied: User is not admin');
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { productId } = req.params;
    const updates = req.body;
    
    // Remove any attempt to update immutable fields
    delete updates._id;
    delete updates.createdAt;
    
    console.log('Finding and updating product...');
    // Update with validation
    const product = await Product.findByIdAndUpdate(
      productId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log('Product updated successfully:', product);
    res.status(200).json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      message: 'Failed to update product', 
      error: error.message 
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { productId } = req.params;
    
    const product = await Product.findByIdAndDelete(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to delete product', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};