const express = require('express');
const router = express.Router();
const { 
  accessChatRoom, 
  getRoomMessages, 
  saveMessage, 
  getAllChatRooms 
} = require('../controllers/chatController');

// Khách hàng hoặc Admin click vào chat để lấy/tạo phòng
router.post('/room', accessChatRoom);

// Lấy lịch sử chat của một phòng cụ thể
router.get('/messages/:roomId', getRoomMessages);

// Lưu một tin nhắn mới vào DB
router.post('/message', saveMessage);

// Admin lấy danh sách tất cả các cuộc hội thoại đang có
router.get('/admin/rooms', getAllChatRooms);

module.exports = router;