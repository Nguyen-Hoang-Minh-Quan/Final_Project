import React, { useState, useEffect, useRef } from 'react';
import { FaCommentDots, FaPaperPlane, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  
  const chatBodyRef = useRef(null);

  // Lấy thông tin tài khoản đang đăng nhập từ localStorage
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const userId = userInfo ? userInfo.id : null;

  // Tự động cuộn xuống đáy khi có tin nhắn mới
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // LUỒNG 1: Khi mở Box Chat -> Kích hoạt tìm hoặc tạo Phòng Chat trong DB
  useEffect(() => {
    if (isOpen && userId) {
      const initChatRoom = async () => {
        try {
          // 1. Gọi API nạp hoặc tạo phòng chat riêng của User
          const roomResponse = await axios.post('http://localhost:5000/api/chat/room', { userId });
          const room = roomResponse.data;
          setActiveRoom(room);

          // 2. Lấy lịch sử chat cũ lưu trong DB của phòng này lên
          const messagesResponse = await axios.get(`http://localhost:5000/api/chat/messages/${room.id}`);
          setMessages(messagesResponse.data);
        } catch (error) {
          console.error('Lỗi khởi tạo hệ thống chat:', error);
          toast.error('Không thể kết nối máy chủ chat!');
        }
      };

      initChatRoom();
    }
  }, [isOpen, userId]);

  // LUỒNG 2: Xử lý sự kiện bấm nút gửi tin nhắn
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Chặn nếu người dùng chưa đăng nhập tài khoản khách hàng
    if (!userId) {
      toast.warning('Vui lòng đăng nhập để sử dụng chức năng hỗ trợ trực tuyến!');
      return;
    }

    // Chặn nếu tiến trình nạp phòng chat từ API chưa xong
    if (!activeRoom) {
      toast.error('Hệ thống chat đang khởi động, vui lòng thử lại sau giây lát!');
      return;
    }

    const currentText = text;
    setText('');

    try {
      // 1. Gọi API Backend để lưu tin nhắn trực tiếp xuống Database Neon
      const response = await axios.post('http://localhost:5000/api/chat/message', {
        room_id: activeRoom.id,
        sender_id: userId,
        message_text: currentText,
        product_context: null // Để null hoặc có thể truyền thông tin vật phẩm nếu cần nâng cấp sau
      });

      // 2. Đẩy tin nhắn vừa lưu thành công từ DB vào mảng state giao diện để hiển thị tức thì
      // Ép object nhận diện sender là 'user' để khớp với CSS hiển thị bên phải màn hình
      setMessages((prev) => [...prev, { ...response.data, sender: 'user' }]);

      // 3. Giả lập Bot tự động tư vấn (UX Demo phục vụ chấm điểm)
      setTimeout(async () => {
        try {
          const botResponse = await axios.post('http://localhost:5000/api/chat/message', {
            room_id: activeRoom.id,
            sender_id: 1, // Mặc định ID 1 đại diện cho Admin/Hệ thống tư vấn tự động
            message_text: `Cửa hàng TCG Shop đã nhận được yêu cầu của bạn về: "${currentText}". Đội ngũ Support sẽ liên hệ bạn ngay!`,
            product_context: null
          });
          
          setMessages((prev) => [...prev, { ...botResponse.data, sender: 'admin' }]);
        } catch (err) {
          console.error('Lỗi lưu tin nhắn của bot:', err);
        }
      }, 1200);

    } catch (error) {
      console.error('Lỗi gửi tin nhắn lên server:', error);
      toast.error('Gửi tin nhắn thất bại, vui lòng kiểm tra kết nối!');
    }
  };

  return (
    <div className="floating-chat-container">
      {/* NÚT TRÒN BONG BÓNG CHAT */}
      {!isOpen && (
        <button className="chat-trigger-btn" onClick={() => setIsOpen(true)}>
          <FaCommentDots />
        </button>
      )}

      {/* KHUNG CỬA SỔ CHAT LỚN */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="d-flex align-items-center gap-2">
              <span className="dot-online"></span>
              <span>💬 HỖ TRỢ TCG SHOP</span>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </div>

          {/* Body chứa nội dung tin nhắn */}
          <div className="chat-body" ref={chatBodyRef}>
            {messages.length === 0 ? (
              <div className="text-center text-muted my-auto" style={{ fontSize: '0.85rem' }}>
                Chưa có tin nhắn nào. Hãy gửi thắc mắc của bạn tại đây nhé!
              </div>
            ) : (
              messages.map((msg, index) => {
                // Biến đổi logic kiểm tra: Nếu sender_id trùng với userId hiện tại -> Đóng vai trò 'user' (bên phải), ngược lại là 'admin' (bên trái)
                const isMyMsg = Number(msg.sender_id) === Number(userId) || msg.sender === 'user';
                return (
                  <div key={msg.id || index} className={`chat-msg ${isMyMsg ? 'user' : 'admin'}`}>
                    {msg.message_text || msg.text}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer chứa form nhập */}
          <form className="chat-footer d-flex gap-2" onSubmit={handleSend}>
            <input 
              type="text" 
              className="form-control tcg-input shadow-none" 
              placeholder={userId ? "Nhập nội dung cần tư vấn..." : "Vui lòng đăng nhập để chat..."}
              disabled={!userId}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button 
              type="submit" 
              className="btn btn-danger tcg-btn d-flex align-items-center justify-content-center px-3"
              disabled={!userId}
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;