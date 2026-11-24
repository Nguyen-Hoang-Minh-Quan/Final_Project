import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaPaperPlane,
  FaTimes,
  FaRobot,
  FaHeadset,
  FaArrowRight,
  FaSignInAlt
} from 'react-icons/fa';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';

// Helper: Giải mã an toàn trường product_context của từng tin nhắn
const parseMessageContext = (rawContext) => {
  if (!rawContext) return null;
  try {
    return typeof rawContext === 'string' ? JSON.parse(rawContext) : rawContext;
  } catch (error) {
    return null;
  }
};

// Helper: Tách hoàn toàn luồng tin nhắn 'staff' (Nhân viên) và 'ai' (Trợ lý AI), hỗ trợ cả dữ liệu cũ
const splitConversationChannels = (allMessages = []) => {
  const staffMessages = [];
  const aiMessages = [];

  for (let i = 0; i < allMessages.length; i++) {
    const msg = allMessages[i];
    const ctx = parseMessageContext(msg.product_context);

    if (ctx?.channel === 'ai' || ctx?.is_ai === true || ctx?.is_ai_query === true) {
      aiMessages.push(msg);
      continue;
    }

    if (ctx?.channel === 'staff') {
      staffMessages.push(msg);
      continue;
    }

    // Xử lý dữ liệu cũ chưa có trường channel
    const isStaffSender =
      msg.sender_is_admin === true ||
      msg.sender_role === 'Admin' ||
      msg.sender_role === 'Staff' ||
      ctx?.sender_role === 'Admin' ||
      ctx?.sender_role === 'Staff';

    if (isStaffSender) {
      staffMessages.push(msg);
      continue;
    }

    let followedByAi = false;
    for (let j = i + 1; j < allMessages.length; j++) {
      const nextMsg = allMessages[j];
      const nextCtx = parseMessageContext(nextMsg.product_context);
      if (nextCtx?.is_ai === true) {
        followedByAi = true;
        break;
      }
      const nextIsStaff =
        nextMsg.sender_is_admin === true ||
        nextMsg.sender_role === 'Admin' ||
        nextMsg.sender_role === 'Staff' ||
        nextCtx?.sender_role === 'Admin' ||
        nextCtx?.sender_role === 'Staff';
      if (nextIsStaff || nextCtx?.channel === 'staff') {
        break;
      }
    }

    if (followedByAi) {
      aiMessages.push(msg);
    } else {
      staffMessages.push(msg);
    }
  }

  return { staffMessages, aiMessages };
};

const QUICK_AI_PROMPTS = [
  'Booster Box stock',
  'Single Card prices',
  'Shipping policy',
  'Authenticity guarantee'
];

const Chatbot = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Trạng thái mở cửa sổ: null | 'ai' | 'staff' (2 bong bóng nổi hoàn toàn độc lập)
  const [activeWidget, setActiveWidget] = useState(null);
  const [aiInput, setAiInput] = useState('');
  const [staffInput, setStaffInput] = useState('');
  const [roomMessages, setRoomMessages] = useState([]);
  const [guestAiMessages, setGuestAiMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tcg_guest_ai_chat');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });
  const [activeRoom, setActiveRoom] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [sendingStaff, setSendingStaff] = useState(false);

  const aiBodyRef = useRef(null);
  const staffBodyRef = useRef(null);

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const userId = userInfo ? userInfo.id : null;
  const userRole =
    userInfo?.isAdmin || userInfo?.role === 'Admin' ? 'Admin' : (userInfo?.role || 'Customer');

  // Tách riêng 2 danh sách tin nhắn từ phòng chat của tài khoản
  const { staffMessages, aiMessages: dbAiMessages } = useMemo(
    () => splitConversationChannels(roomMessages),
    [roomMessages]
  );

  // Nếu khách chưa đăng nhập thì dùng lịch sử AI tạm trên trình duyệt, đã đăng nhập thì đồng bộ DB
  const displayedAiMessages = userId ? dbAiMessages : guestAiMessages;

  // Kiểm tra xem tin nhắn cuối ở kênh Live Support có phải là phản hồi mới từ Nhân viên không
  const hasStaffReply = useMemo(() => {
    if (!userId || staffMessages.length === 0) return false;
    const lastMsg = staffMessages[staffMessages.length - 1];
    const ctx = parseMessageContext(lastMsg.product_context);
    return !ctx?.is_ai && Number(lastMsg.sender_id) !== Number(userId);
  }, [staffMessages, userId]);

  // Lưu lịch sử AI cho khách vãng lai vào sessionStorage
  useEffect(() => {
    if (!userId) {
      try {
        sessionStorage.setItem('tcg_guest_ai_chat', JSON.stringify(guestAiMessages));
      } catch (error) {
        // Bỏ qua nếu bộ nhớ trình duyệt đầy
      }
    }
  }, [guestAiMessages, userId]);

  // Tự động cuộn xuống cuối khung AI khi có câu trả lời mới
  useEffect(() => {
    if (activeWidget === 'ai' && aiBodyRef.current) {
      aiBodyRef.current.scrollTop = aiBodyRef.current.scrollHeight;
    }
  }, [displayedAiMessages.length, activeWidget, loadingAI]);

  // Tự động cuộn xuống cuối khung Live Support khi có tin nhắn mới
  useEffect(() => {
    if (activeWidget === 'staff' && staffBodyRef.current) {
      staffBodyRef.current.scrollTop = staffBodyRef.current.scrollHeight;
    }
  }, [staffMessages.length, activeWidget]);

  // Khởi tạo phòng chat và polling tin nhắn cho tài khoản đã đăng nhập
  useEffect(() => {
    if (!userId || location.pathname.startsWith('/admin')) return;

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
          setRoomMessages(Array.isArray(messagesResponse.data) ? messagesResponse.data : []);
        }
      } catch (error) {
        console.error('Error initializing chat room:', error);
      }
    };

    initAndPollChatRoom();
    // Tăng tốc độ cập nhật khi đang mở cửa sổ chat, giảm tần suất khi đang đóng
    const pollDelay = activeWidget ? 3000 : 8000;
    intervalId = setInterval(initAndPollChatRoom, pollDelay);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWidget, userId, location.pathname]);

  // Ẩn bong bóng chat khách hàng trên các trang quản trị /admin để không đè lên StaffChat
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  // Đảm bảo có phòng chat hợp lệ trước khi lưu DB cho user đã đăng nhập
  const ensureUserRoom = async () => {
    if (activeRoom && Number(activeRoom.user_id) === Number(userId)) {
      return activeRoom;
    }
    const roomResponse = await axiosClient.post('/chat/room', { userId });
    setActiveRoom(roomResponse.data);
    return roomResponse.data;
  };

  // Gửi câu hỏi cho AI Assistant (Hoạt động cho cả khách chưa đăng nhập và đã đăng nhập)
  const submitAiQuestion = async (rawPrompt) => {
    const promptText = rawPrompt.trim();
    if (!promptText || loadingAI) return;

    setAiInput('');
    setLoadingAI(true);

    try {
      // Trường hợp 1: Khách chưa đăng nhập -> chạy trực tiếp với API /chat/ai
      if (!userId) {
        const userMsg = {
          id: `guest-u-${Date.now()}`,
          message_text: promptText,
          created_at: new Date().toISOString(),
          product_context: { channel: 'ai', is_ai: false, is_ai_query: true }
        };
        setGuestAiMessages((prev) => [...prev, userMsg]);

        const aiRes = await axiosClient.post('/chat/ai', { message: promptText });
        const botMsg = {
          id: `guest-b-${Date.now() + 1}`,
          message_text: aiRes.data.reply,
          created_at: new Date().toISOString(),
          product_context: { channel: 'ai', is_ai: true, sender_name: 'TCG AI Assistant' }
        };
        setGuestAiMessages((prev) => [...prev, botMsg]);
        return;
      }

      // Trường hợp 2: Khách đã đăng nhập -> lưu vào luồng channel: 'ai' để đồng bộ sang tab AI Log của Staff
      const room = await ensureUserRoom();
      const savedUserQuestion = await axiosClient.post('/chat/message', {
        room_id: room.id,
        sender_id: userId,
        message_text: promptText,
        product_context: {
          channel: 'ai',
          is_ai: false,
          is_ai_query: true,
          sender_name: userInfo?.name || 'Customer',
          sender_role: userRole
        }
      });

      setRoomMessages((prev) => [...prev, savedUserQuestion.data]);

      const aiRes = await axiosClient.post('/chat/ai', { message: promptText });

      // Dùng sender_id = userId để luôn thỏa khóa ngoại bảng Users, phân biệt bằng is_ai: true & channel: 'ai'
      const savedBotReply = await axiosClient.post('/chat/message', {
        room_id: room.id,
        sender_id: userId,
        message_text: aiRes.data.reply,
        product_context: {
          channel: 'ai',
          is_ai: true,
          sender_name: 'TCG AI Assistant',
          sender_role: 'AI BOT'
        }
      });

      setRoomMessages((prev) => [...prev, savedBotReply.data]);
    } catch (error) {
      console.error('Error communicating with AI Assistant:', error);
      toast.error('AI Assistant is temporarily unavailable. Please try again!');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAiSubmit = (e) => {
    e.preventDefault();
    submitAiQuestion(aiInput);
  };

  // Gửi tin nhắn trực tiếp cho Nhân viên hỗ trợ (Kênh Live Support độc lập)
  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    const messageText = staffInput.trim();
    if (!messageText || sendingStaff) return;

    if (!userId) {
      toast.warning('Please sign in to chat directly with our support staff!');
      return;
    }

    setStaffInput('');
    setSendingStaff(true);

    try {
      const room = await ensureUserRoom();
      const response = await axiosClient.post('/chat/message', {
        room_id: room.id,
        sender_id: userId,
        message_text: messageText,
        product_context: {
          channel: 'staff',
          is_ai: false,
          sender_name: userInfo?.name || 'Customer',
          sender_role: userRole
        }
      });

      setRoomMessages((prev) => [...prev, response.data]);
    } catch (error) {
      console.error('Error sending message to support staff:', error);
      toast.error('Failed to send message. Please check your connection!');
    } finally {
      setSendingStaff(false);
    }
  };

  const getStaffSenderLabel = (msg) => {
    const ctx = parseMessageContext(msg.product_context);
    const name = msg.sender_name || ctx?.sender_name || 'Support Team';
    const role =
      msg.sender_is_admin || msg.sender_role === 'Admin' || ctx?.sender_role === 'Admin'
        ? 'Admin'
        : 'Staff';
    return `👨‍💼 ${name} (${role})`;
  };

  return (
    <>
      {/* CỬA SỔ 1: TRỢ LÝ AI TỰ ĐỘNG (HOÀN TOÀN TÁCH BIỆT VỚI CHAT NHÂN VIÊN) */}
      {activeWidget === 'ai' && (
        <div className="chat-window">
          <div className="chat-header ai-header">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.18)' }}
              >
                <FaRobot className="fs-5" />
              </div>
              <div className="lh-sm">
                <div className="fw-bold" style={{ fontSize: '0.92rem' }}>
                  TCG AI ASSISTANT
                </div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85, fontWeight: 400 }}>
                  Instant card lookup, stock & store policies
                </div>
              </div>
            </div>
            <button
              type="button"
              className="chat-close-btn"
              onClick={() => setActiveWidget(null)}
              title="Close AI Assistant"
            >
              <FaTimes />
            </button>
          </div>

          <div className="chat-body ai-body" ref={aiBodyRef}>
            {/* Gợi ý câu hỏi nhanh giúp khách dễ trải nghiệm AI */}
            <div className="bg-white p-2 rounded-3 border shadow-sm">
              <div className="fw-bold text-secondary mb-2" style={{ fontSize: '0.73rem' }}>
                QUICK TOPICS:
              </div>
              <div className="d-flex flex-wrap gap-1">
                {QUICK_AI_PROMPTS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="ai-quick-chip"
                    disabled={loadingAI}
                    onClick={() => submitAiQuestion(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {displayedAiMessages.length === 0 ? (
              <div className="text-center text-muted my-auto p-3" style={{ fontSize: '0.84rem' }}>
                <FaRobot className="fs-2 mb-2" style={{ color: '#6d28d9', opacity: 0.75 }} />
                <div className="fw-bold text-dark mb-1">Ask TCG AI Anything!</div>
                <div>
                  Look up card prices, check real-time stock, or ask about shipping & authenticity in
                  English or Vietnamese.
                </div>
              </div>
            ) : (
              displayedAiMessages.map((msg, index) => {
                const ctx = parseMessageContext(msg.product_context);
                const isBot = Boolean(ctx?.is_ai);

                return (
                  <div
                    key={msg.id || index}
                    className={`chat-msg ${isBot ? 'ai-bot' : 'ai-user'}`}
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    <div
                      className="fw-bold mb-1"
                      style={{ fontSize: '0.72rem', color: isBot ? '#6d28d9' : '#4c1d95' }}
                    >
                      {isBot ? '🤖 TCG AI Bot' : `You${userInfo?.name ? ` (${userInfo.name})` : ''}`}
                    </div>
                    <div>{msg.message_text || msg.text}</div>
                  </div>
                );
              })
            )}

            {loadingAI && (
              <div className="chat-msg ai-bot text-muted" style={{ fontSize: '0.82rem' }}>
                🤖 Searching TCG Shop database...
              </div>
            )}
          </div>

          {/* Thanh chuyển nhanh sang gặp Nhân viên thật nếu khách cần hỗ trợ đơn hàng */}
          <div
            className="px-3 py-1 d-flex justify-content-between align-items-center border-top"
            style={{ backgroundColor: '#f3e8ff', fontSize: '0.75rem' }}
          >
            <span className="text-muted">Need help with an order?</span>
            <button
              type="button"
              className="btn btn-link btn-sm p-0 fw-bold text-decoration-none d-flex align-items-center gap-1"
              style={{ color: '#dc3545', fontSize: '0.75rem' }}
              onClick={() => setActiveWidget('staff')}
            >
              Switch to Live Staff <FaArrowRight size={10} />
            </button>
          </div>

          <form className="chat-footer d-flex gap-2" onSubmit={handleAiSubmit}>
            <input
              type="text"
              className="form-control tcg-input shadow-none py-2"
              placeholder="Ask AI about cards, stock, shipping..."
              disabled={loadingAI}
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
            />
            <button
              type="submit"
              className="btn tcg-btn text-white d-flex align-items-center justify-content-center px-3"
              style={{ backgroundColor: '#6d28d9' }}
              disabled={!aiInput.trim() || loadingAI}
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}

      {/* CỬA SỔ 2: CHAT TRỰC TIẾP VỚI NHÂN VIÊN / ADMIN (KHÔNG TRỘN LẪN TIN NHẮN AI) */}
      {activeWidget === 'staff' && (
        <div className="chat-window">
          <div className="chat-header staff-header">
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.18)' }}
              >
                <FaHeadset className="fs-5" />
              </div>
              <div className="lh-sm">
                <div className="fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.92rem' }}>
                  <span>LIVE STAFF SUPPORT</span>
                  <span className="dot-online" title="Support Online"></span>
                </div>
                <div style={{ fontSize: '0.72rem', opacity: 0.88, fontWeight: 400 }}>
                  Direct chat with TCG Shop Staff & Admin
                </div>
              </div>
            </div>
            <button
              type="button"
              className="chat-close-btn"
              onClick={() => setActiveWidget(null)}
              title="Close Live Support"
            >
              <FaTimes />
            </button>
          </div>

          <div className="chat-body" ref={staffBodyRef}>
            {!userId ? (
              <div className="text-center my-auto p-3">
                <FaHeadset className="fs-1 text-danger mb-2 opacity-75" />
                <h6 className="fw-bold text-dark">Sign In Required for Live Support</h6>
                <p className="text-muted mb-3" style={{ fontSize: '0.83rem' }}>
                  Please sign in so our staff can verify your account and assist with your orders.
                </p>
                <button
                  type="button"
                  className="btn btn-danger tcg-btn btn-sm w-100 mb-2 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => {
                    setActiveWidget(null);
                    navigate('/login');
                  }}
                >
                  <FaSignInAlt /> SIGN IN TO CHAT
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm w-100 fw-bold"
                  style={{ borderRadius: '8px', fontSize: '0.78rem' }}
                  onClick={() => setActiveWidget('ai')}
                >
                  🤖 Or use AI Assistant (No sign-in needed)
                </button>
              </div>
            ) : staffMessages.length === 0 ? (
              <div className="text-center text-muted my-auto p-3" style={{ fontSize: '0.84rem' }}>
                <FaHeadset className="fs-2 text-danger mb-2 opacity-75" />
                <div className="fw-bold text-dark mb-1">Chat with Real Support Staff</div>
                <div>
                  Send us a message regarding your orders, payment, or special requests. A staff
                  member will respond here!
                </div>
              </div>
            ) : (
              staffMessages.map((msg, index) => {
                const ctx = parseMessageContext(msg.product_context);
                const isStaffSender =
                  msg.sender_is_admin === true ||
                  msg.sender_role === 'Admin' ||
                  msg.sender_role === 'Staff' ||
                  ctx?.sender_role === 'Admin' ||
                  ctx?.sender_role === 'Staff';
                const isMyMsg = !isStaffSender && Number(msg.sender_id) === Number(userId);

                return (
                  <div
                    key={msg.id || index}
                    className={`chat-msg ${isMyMsg ? 'user' : 'admin'}`}
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    <div
                      className="fw-bold mb-1"
                      style={{ fontSize: '0.72rem', color: isMyMsg ? '#b02a37' : '#0d6efd' }}
                    >
                      {isMyMsg ? `You (${userInfo?.name || 'Customer'})` : getStaffSenderLabel(msg)}
                    </div>
                    <div>{msg.message_text || msg.text}</div>
                  </div>
                );
              })
            )}
          </div>

          {userId && (
            <form className="chat-footer d-flex gap-2" onSubmit={handleStaffSubmit}>
              <input
                type="text"
                className="form-control tcg-input shadow-none py-2"
                placeholder="Write a message to support staff..."
                disabled={sendingStaff}
                value={staffInput}
                onChange={(e) => setStaffInput(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-danger tcg-btn d-flex align-items-center justify-content-center px-3"
                disabled={!staffInput.trim() || sendingStaff}
              >
                <FaPaperPlane />
              </button>
            </form>
          )}
        </div>
      )}

      {/* CỤM 2 BONG BÓNG NỔI ĐỘC LẬP Ở GÓC DƯỚI BÊN PHẢI */}
      <div className="floating-chat-container">
        {/* Bong bóng 1: AI Assistant */}
        <div className="chat-dock-item">
          <span className="chat-dock-label">🤖 AI Card Assistant</span>
          <button
            type="button"
            className={`chat-trigger-btn ai-trigger ${activeWidget === 'ai' ? 'active-trigger' : ''}`}
            onClick={() => setActiveWidget((prev) => (prev === 'ai' ? null : 'ai'))}
            title="TCG AI Assistant (Instant Lookup)"
          >
            <FaRobot />
            <span className="chat-trigger-pill ai-pill">AI</span>
          </button>
        </div>

        {/* Bong bóng 2: Live Staff Support */}
        <div className="chat-dock-item">
          <span className="chat-dock-label">👨‍💼 Live Staff Support</span>
          <button
            type="button"
            className={`chat-trigger-btn staff-trigger ${
              activeWidget === 'staff' ? 'active-trigger' : ''
            }`}
            onClick={() => setActiveWidget((prev) => (prev === 'staff' ? null : 'staff'))}
            title="Live Support (Chat with Staff)"
          >
            <FaHeadset />
            <span className="chat-trigger-pill staff-pill">STAFF</span>
            {hasStaffReply && activeWidget !== 'staff' && (
              <span className="chat-unread-dot" title="Staff replied to your message" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
