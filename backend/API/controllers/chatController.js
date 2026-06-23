const { sequelize } = require('../config/db');
const { QueryTypes } = require('sequelize');

// 1. User hoặc Admin mở phòng chat (Nếu chưa có phòng thì tạo mới, có rồi thì trả về)
const accessChatRoom = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Thiếu thông tin userId khách hàng!' });
    }

    // Kiểm tra xem phòng chat giữa User này và Admin đã tồn tại chưa
    const roomCheck = await sequelize.query(
      'SELECT * FROM chat_rooms WHERE user_id = :userId LIMIT 1',
      {
        replacements: { userId },
        type: QueryTypes.SELECT
      }
    );

    if (roomCheck.length > 0) {
      return res.status(200).json(roomCheck[0]);
    }

    // Nếu chưa có, tiến hành tạo mới một phòng chat
    const [newRoom] = await sequelize.query(
      'INSERT INTO chat_rooms (user_id, created_at) VALUES (:userId, NOW()) RETURNING *',
      {
        replacements: { userId },
        type: QueryTypes.INSERT
      }
    );

    res.status(201).json(newRoom[0]);
  } catch (error) {
    console.error('Lỗi khi truy cập phòng chat:', error.message);
    res.status(500).json({ message: 'Lỗi server nội bộ: ' + error.message });
  }
};

// 2. Lấy toàn bộ lịch sử tin nhắn cũ của một phòng chat (Để hiển thị khi vừa mở hộp chat)
const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const messages = await sequelize.query(
      'SELECT * FROM chat_messages WHERE room_id = :roomId ORDER BY created_at ASC',
      {
        replacements: { roomId },
        type: QueryTypes.SELECT
      }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử tin nhắn:', error.message);
    res.status(500).json({ message: 'Lỗi lịch sử chat: ' + error.message });
  }
};

// 3. API lưu tin nhắn (Dùng để backup dữ liệu khi user/admin bấm gửi tin nhắn)
const saveMessage = async (req, res) => {
  try {
    const { room_id, sender_id, message_text, product_context } = req.body;

    if (!room_id || !sender_id || !message_text) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin tin nhắn bắt buộc!' });
    }

    const [newMessage] = await sequelize.query(
      `INSERT INTO chat_messages (room_id, sender_id, message_text, product_context, is_read, created_at) 
       VALUES (:room_id, :sender_id, :message_text, :product_context, false, NOW()) RETURNING *`,
      {
        replacements: {
          room_id,
          sender_id,
          message_text,
          product_context: product_context ? JSON.stringify(product_context) : null
        },
        type: QueryTypes.INSERT
      }
    );

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error('Lỗi khi lưu tin nhắn:', error.message);
    res.status(500).json({ message: 'Lỗi không thể lưu tin nhắn: ' + error.message });
  }
};

// 4. Dành cho trang AdminDashboard: Lấy danh sách tất cả các phòng chat đang hoạt động kèm thông tin User
const getAllChatRooms = async (req, res) => {
  try {
    // Ép kiểu tên bảng "Users" viết hoa nằm trong dấu ngoặc kép để khớp với bảng thực tế trên Neon của bạn
    const rooms = await sequelize.query(
      `SELECT cr.*, u.name as user_name, u.email as user_email 
       FROM chat_rooms cr
       JOIN "Users" u ON cr.user_id = u.id
       ORDER BY cr.created_at DESC`,
      { type: QueryTypes.SELECT }
    );

    res.status(200).json(rooms);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng chat:', error.message);
    res.status(500).json({ message: 'Lỗi nạp danh sách chat của admin: ' + error.message });
  }
};

module.exports = {
  accessChatRoom,
  getRoomMessages,
  saveMessage,
  getAllChatRooms
};