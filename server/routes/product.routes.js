const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth.middleware');
const productController = require('../controllers/product.controller');

// Routes accessible by all authenticated users
router.get('/', productController.getAllProducts);
router.get('/:productId', productController.getProductById);

// Routes accessible only by admin users
router.post('/', isAdmin, productController.createProduct);
router.put('/:productId', isAdmin, productController.updateProduct);
router.delete('/:productId', isAdmin, productController.deleteProduct);

module.exports = router;