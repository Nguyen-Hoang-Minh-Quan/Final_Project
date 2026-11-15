const express = require('express');
const router = express.Router();
const { 
  accessChatRoom, 
  getRoomMessages, 
  saveMessage, 
  getAllChatRooms,
  handleAIChat
} = require('../controllers/chatController');

router.post('/room', accessChatRoom);
router.get('/messages/:roomId', getRoomMessages);
router.post('/message', saveMessage);
router.get('/admin/rooms', getAllChatRooms);
router.post('/ai', handleAIChat);

module.exports = router;