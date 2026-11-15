import React, { useState, useEffect, useRef } from 'react';
import { FaCommentDots, FaPaperPlane, FaTimes, FaRobot } from 'react-icons/fa';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  
  const chatBodyRef = useRef(null);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const userId = userInfo ? userInfo.id : null;

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isOpen, loadingAI]);

  // Nạp hoặc tạo phòng chat riêng của User khi mở box chat
  useEffect(() => {
    if (isOpen && userId) {
      const initChatRoom = async () => {
        try {
          const roomResponse = await axiosClient.post('/chat/room', { userId });
          const room = roomResponse.data;
          setActiveRoom(room);

          const messagesResponse = await axiosClient.get(`/chat/messages/${room.id}`);
          setMessages(messagesResponse.data);
        } catch (error) {
          console.error('Lỗi khởi tạo hệ thống chat:', error);
          toast.error('Không thể kết nối máy chủ chat!');
        }
      };

      initChatRoom();
    }
  }, [isOpen, userId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (!userId) {
      toast.warning('Vui lòng đăng nhập để sử dụng chức năng hỗ trợ trực tuyến!');
      return;
    }

    if (!activeRoom) {
      toast.error('Hệ thống chat đang khởi động, vui lòng thử lại sau giây lát!');
      return;
    }

    const currentText = text;
    setText('');

    try {
      // 1. Lưu tin nhắn của User xuống Database Neon
      const response = await axiosClient.post('/chat/message', {
        room_id: activeRoom.id,
        sender_id: userId,
        message_text: currentText,
        product_context: null
      });

      // 2. Hiển thị tin nhắn của User lên giao diện ngay lập tức
      setMessages((prev) => [...prev, { ...response.data, sender: 'user' }]);
      setLoadingAI(true);

      // 3. Gọi thuật toán AI xử lý câu hỏi
      setTimeout(async () => {
        try {
          const aiRes = await axiosClient.post('/chat/ai', {
            message: currentText
          });

          // Lưu câu trả lời của AI vào Database (Sender ID: 1 đại diện cho Bot/System)
          const botMessageRecord = await axiosClient.post('/chat/message', {
            room_id: activeRoom.id,
            sender_id: 1,
            message_text: aiRes.data.reply,
            product_context: null
          });

          // Hiển thị câu trả lời của AI lên giao diện
          setMessages((prev) => [...prev, { ...botMessageRecord.data, sender: 'admin' }]);
        } catch (err) {
          console.error('Lỗi phản hồi từ AI Bot:', err);
        } finally {
          setLoadingAI(false);
        }
      }, 700);

    } catch (error) {
      console.error('Lỗi gửi tin nhắn lên server:', error);
      toast.error('Gửi tin nhắn thất bại, vui lòng kiểm tra kết nối!');
      setLoadingAI(false);
    }
  };

  return (
    <div className="floating-chat-container">
      {/* NÚT BONG BÓNG CHAT */}
      {!isOpen && (
        <button className="chat-trigger-btn" onClick={() => setIsOpen(true)}>
          <FaCommentDots />
        </button>
      )}

      {/* KHUNG CỬA SỔ CHAT */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="d-flex align-items-center gap-2">
              <span className="dot-online"></span>
              <span className="fw-bold d-flex align-items-center gap-1">
                <FaRobot /> TRỢ LÝ AI TCG SHOP
              </span>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </div>

          {/* Body */}
          <div className="chat-body" ref={chatBodyRef}>
            {messages.length === 0 ? (
              <div className="text-center text-muted my-auto p-3" style={{ fontSize: '0.85rem' }}>
                Xin chào! Bạn có thể hỏi tôi về giá thẻ bài, hàng trong kho hoặc chính sách vận chuyển nhé!
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMyMsg = Number(msg.sender_id) === Number(userId) || msg.sender === 'user';
                return (
                  <div key={msg.id || index} className={`chat-msg ${isMyMsg ? 'user' : 'admin'}`} style={{ whiteSpace: 'pre-line' }}>
                    {msg.message_text || msg.text}
                  </div>
                );
              })
            )}
            {loadingAI && (
              <div className="chat-msg admin text-muted italic" style={{ fontSize: '0.8rem' }}>
                Trợ lý AI đang tra cứu cơ sở dữ liệu...
              </div>
            )}
          </div>

          {/* Footer */}
          <form className="chat-footer d-flex gap-2" onSubmit={handleSend}>
            <input 
              type="text" 
              className="form-control tcg-input shadow-none" 
              placeholder={userId ? "Nhập tên thẻ bài hoặc câu hỏi..." : "Vui lòng đăng nhập để chat..."}
              disabled={!userId || loadingAI}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button 
              type="submit" 
              className="btn btn-danger tcg-btn d-flex align-items-center justify-content-center px-3"
              disabled={!userId || loadingAI}
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