import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaCommentDots, FaPaperPlane, FaTimes, FaRobot, FaUserTie } from 'react-icons/fa';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';

const Chatbot = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState('ai'); // 'ai' | 'staff'
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const chatBodyRef = useRef(null);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const userId = userInfo ? userInfo.id : null;
  const userRole = userInfo?.isAdmin || userInfo?.role === 'Admin' ? 'Admin' : (userInfo?.role || 'Customer');

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages.length, isOpen, loadingAI]);

  // Nạp hoặc tạo phòng chat riêng của User khi mở box chat + Polling tin nhắn mới từ Nhân viên
  useEffect(() => {
    if (!isOpen || !userId || location.pathname.startsWith('/admin')) return;

    let intervalId = null;

    const initAndPollChatRoom = async () => {
      try {
        let currentRoom = activeRoom;
        if (!currentRoom || Number(currentRoom.user_id) !== Number(userId)) {
          const roomResponse = await axiosClient.post('/chat/room', { userId });
          currentRoom = roomResponse.data;
          setActiveRoom(currentRoom);
        }

        if (currentRoom?.id) {
          const messagesResponse = await axiosClient.get(`/chat/messages/${currentRoom.id}`);
          setMessages(Array.isArray(messagesResponse.data) ? messagesResponse.data : []);
        }
      } catch (error) {
        console.error('Lỗi khởi tạo hệ thống chat:', error);
      }
    };

    initAndPollChatRoom();
    intervalId = setInterval(initAndPollChatRoom, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId, location.pathname]);

  // Ẩn bong bóng chat khách hàng trên các trang quản trị /admin để không đè giao diện StaffChat
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

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

    const currentText = text.trim();
    setText('');

    try {
      // 1. Lưu tin nhắn của User xuống Database
      const response = await axiosClient.post('/chat/message', {
        room_id: activeRoom.id,
        sender_id: userId,
        message_text: currentText,
        product_context: {
          sender_name: userInfo?.name || 'Khách hàng',
          sender_role: userRole
        }
      });

      setMessages((prev) => [...prev, response.data]);

      // 2. Chỉ gọi AI trả lời tự động khi khách đang ở chế độ 'ai'
      if (chatMode === 'ai') {
        setLoadingAI(true);
        setTimeout(async () => {
          try {
            const aiRes = await axiosClient.post('/chat/ai', {
              message: currentText
            });

            // Đánh dấu rõ product_context.is_ai = true để không bị nhầm với Admin ID=1
            const botMessageRecord = await axiosClient.post('/chat/message', {
              room_id: activeRoom.id,
              sender_id: 1,
              message_text: aiRes.data.reply,
              product_context: {
                is_ai: true,
                sender_name: 'Trợ lý AI TCG',
                sender_role: 'AI BOT'
              }
            });

            setMessages((prev) => [...prev, botMessageRecord.data]);
          } catch (err) {
            console.error('Lỗi phản hồi từ AI Bot:', err);
          } finally {
            setLoadingAI(false);
          }
        }, 600);
      }
    } catch (error) {
      console.error('Lỗi gửi tin nhắn lên server:', error);
      toast.error('Gửi tin nhắn thất bại, vui lòng kiểm tra kết nối!');
      setLoadingAI(false);
    }
  };

  const getSenderLabel = (msg) => {
    let ctx = null;
    if (msg.product_context) {
      try {
        ctx = typeof msg.product_context === 'string' ? JSON.parse(msg.product_context) : msg.product_context;
      } catch (e) {
        ctx = null;
      }
    }
    if (ctx?.is_ai) return '🤖 Trợ lý AI TCG';
    const name = msg.sender_name || ctx?.sender_name || 'Nhân viên hỗ trợ';
    const role = msg.sender_is_admin || msg.sender_role === 'Admin' ? 'Admin' : 'Staff';
    return `👨‍💼 ${name} (${role})`;
  };

  return (
    <div className="floating-chat-container">
      {!isOpen && (
        <button className="chat-trigger-btn" onClick={() => setIsOpen(true)} title="Hỗ trợ trực tuyến">
          <FaCommentDots />
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header flex-column align-items-stretch gap-2">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <span className="dot-online"></span>
                <span className="fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.92rem' }}>
                  {chatMode === 'ai' ? <FaRobot /> : <FaUserTie />}
                  {chatMode === 'ai' ? 'TRỢ LÝ AI TCG SHOP' : 'CHAT VỚI NHÂN VIÊN'}
                </span>
              </div>
              <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
                <FaTimes />
              </button>
            </div>

            {/* Chuyển chế độ AI / Nhân viên */}
            <div className="d-flex gap-1 bg-dark bg-opacity-25 p-1 rounded">
              <button
                type="button"
                onClick={() => setChatMode('ai')}
                className={`btn btn-sm flex-fill fw-bold py-1 ${
                  chatMode === 'ai' ? 'btn-warning text-dark' : 'text-white'
                }`}
                style={{ fontSize: '0.73rem' }}
              >
                🤖 Hỏi AI tự động
              </button>
              <button
                type="button"
                onClick={() => setChatMode('staff')}
                className={`btn btn-sm flex-fill fw-bold py-1 ${
                  chatMode === 'staff' ? 'btn-warning text-dark' : 'text-white'
                }`}
                style={{ fontSize: '0.73rem' }}
              >
                👨‍💼 Gặp Nhân viên
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="chat-body" ref={chatBodyRef}>
            {messages.length === 0 ? (
              <div className="text-center text-muted my-auto p-3" style={{ fontSize: '0.85rem' }}>
                Xin chào! Bạn có thể chọn <strong>Hỏi AI tự động</strong> để tra cứu thẻ bài nhanh, hoặc chọn{' '}
                <strong>Gặp Nhân viên</strong> để trò chuyện trực tiếp với đội ngũ hỗ trợ nhé!
              </div>
            ) : (
              messages.map((msg, index) => {
                let ctx = null;
                try {
                  ctx =
                    typeof msg.product_context === 'string'
                      ? JSON.parse(msg.product_context)
                      : msg.product_context;
                } catch (e) {
                  ctx = null;
                }
                const isAi = Boolean(ctx?.is_ai);
                const isMyMsg = !isAi && Number(msg.sender_id) === Number(userId);

                return (
                  <div
                    key={msg.id || index}
                    className={`chat-msg ${isMyMsg ? 'user' : 'admin'}`}
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    <div
                      className="fw-bold mb-1"
                      style={{ fontSize: '0.72rem', color: isMyMsg ? '#b02a37' : '#495057' }}
                    >
                      {isMyMsg ? `Bạn (${userInfo?.name || 'Khách'})` : getSenderLabel(msg)}
                    </div>
                    <div>{msg.message_text || msg.text}</div>
                  </div>
                );
              })
            )}
            {loadingAI && (
              <div className="chat-msg admin text-muted italic" style={{ fontSize: '0.8rem' }}>
                🤖 Trợ lý AI đang tra cứu cơ sở dữ liệu...
              </div>
            )}
          </div>

          {/* Footer */}
          <form className="chat-footer d-flex gap-2 p-2 bg-white border-top" onSubmit={handleSend}>
            <input
              type="text"
              className="form-control tcg-input shadow-none"
              placeholder={
                !userId
                  ? 'Vui lòng đăng nhập để chat...'
                  : chatMode === 'ai'
                  ? 'Hỏi AI giá thẻ, tồn kho...'
                  : 'Nhắn tin cho nhân viên hỗ trợ...'
              }
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
