const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Apply authentication middleware to all chat routes
router.use(authenticateToken);

router.post('/message', chatController.sendMessage);
router.get('/', chatController.getChats);
router.get('/:chatId', chatController.getChatById);
router.delete('/:chatId', chatController.deleteChat);

module.exports = router;