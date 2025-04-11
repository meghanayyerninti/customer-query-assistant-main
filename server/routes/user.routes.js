const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

// Apply authentication middleware to all user routes
router.use(authenticateToken);

// Admin only route
router.get('/', isAdmin, userController.getAllUsers);

// Routes with mixed access
router.get('/:userId', userController.getUserById);
router.put('/:userId', userController.updateUser);
router.delete('/:userId', isAdmin, userController.deleteUser);

module.exports = router;