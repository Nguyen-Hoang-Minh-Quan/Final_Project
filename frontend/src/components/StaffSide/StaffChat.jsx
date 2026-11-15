import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaComments,
  FaPaperPlane,
  FaChevronLeft,
  FaCircle,
  FaSearch,
  FaUserShield,
  FaUserTie,
  FaUser,
  FaRobot
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import '../../styles/TCGStyles.css';

const StaffChat = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'customer' | 'internal'

  const chatBodyRef = useRef(null);

  // Thông tin tài khoản đang đăng nhập
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const staffId = userInfo.id ? Number(userInfo.id) : null;
  const myName = userInfo.name || 'Nhân viên';
  const myEmail = userInfo.email || '';
  const myRole = userInfo.isAdmin || userInfo.role === 'Admin' ? 'Admin' : (userInfo.role || 'Staff');

  // Helper lấy chữ cái đầu làm Avatar
  const getInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Helper cấu hình màu sắc & nhãn theo Role
  const getRoleMeta = (role, isAdmin = false) => {
    const normalized = isAdmin || role === 'Admin' ? 'Admin' : (role === 'Staff' ? 'Staff' : 'Customer');
    if (normalized === 'Admin') {
      return {
        label: 'ADMIN',
        badgeBg: 'danger',
        avatarBg: 'linear-gradient(135deg, #dc3545, #9b1c28)',
        icon: <FaUserShield className="me-1" />
      };
    }
    if (normalized === 'Staff') {
      return {
        label: 'STAFF',
        badgeBg: 'primary',
        avatarBg: 'linear-gradient(135deg, #0d6efd, #084298)',
        icon: <FaUserTie className="me-1" />
      };
    }
    return {
      label: 'KHÁCH HÀNG',
      badgeBg: 'success',
      avatarBg: 'linear-gradient(135deg, #198754, #0f5132)',
      icon: <FaUser className="me-1" />
    };
  };

  // 1. Tải danh sách phòng chat (Loại bỏ hoàn toàn phòng của chính bản thân)
  const fetchRooms = async (isInitial = false) => {
    if (!staffId) return;
    try {
      const { data } = await axiosClient.get(`/chat/admin/rooms?viewerId=${staffId}`);

      // Chốt chặn kép ở cả Frontend: Không bao giờ hiển thị phòng có user_id trùng với tài khoản đang đăng nhập
      const filtered = (Array.isArray(data) ? data : []).filter(
        (r) => Number(r.user_id) !== Number(staffId)
      );

      // Khử trùng lặp theo user_id để mỗi người chỉ xuất hiện 1 dòng duy nhất
      const uniqueByUser = [];
      const seenUsers = new Set();
      for (const r of filtered) {
        const uid = Number(r.user_id);
        if (!seenUsers.has(uid)) {
          seenUsers.add(uid);
          uniqueByUser.push(r);
        }
      }

      setRooms(uniqueByUser);

      if (isInitial && uniqueByUser.length > 0) {
        setActiveRoom((prev) => {
          if (prev && Number(prev.user_id) !== Number(staffId)) return prev;
          return uniqueByUser[0];
        });
      }
    } catch (error) {
      console.error('Error loading chat room list:', error);
    }
  };

  useEffect(() => {
    fetchRooms(true);
    const interval = setInterval(() => fetchRooms(false), 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  // Bảo vệ: Nếu activeRoom vô tình trùng với bản thân thì tự động chuyển sang phòng hợp lệ đầu tiên
  useEffect(() => {
    if (activeRoom && Number(activeRoom.user_id) === Number(staffId)) {
      const firstValid = rooms.find((r) => Number(r.user_id) !== Number(staffId)) || null;
      setActiveRoom(firstValid);
    }
  }, [activeRoom, rooms, staffId]);

  // 2. Lấy lịch sử tin nhắn khi chọn phòng chat
  useEffect(() => {
    if (activeRoom && Number(activeRoom.user_id) !== Number(staffId)) {
      const fetchMessages = async () => {
        try {
          const { data } = await axiosClient.get(`/chat/messages/${activeRoom.id}`);
          setMessages(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error loading message history:', error);
        }
      };
      fetchMessages();

      const msgInterval = setInterval(fetchMessages, 2500);
      return () => clearInterval(msgInterval);
    } else {
      setMessages([]);
    }
  }, [activeRoom, staffId]);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages.length, activeRoom?.id]);

  // 3. Gửi tin nhắn
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeRoom || !staffId) return;

    if (Number(activeRoom.user_id) === Number(staffId)) {
      toast.warning('Bạn không thể tự nhắn tin cho chính mình!');
      return;
    }

    const messageText = text.trim();
    setText('');

    try {
      const { data } = await axiosClient.post('/chat/message', {
        room_id: activeRoom.id,
        sender_id: staffId,
        message_text: messageText,
        product_context: {
          sender_name: myName,
          sender_role: myRole
        }
      });

      setMessages((prev) => [
        ...prev,
        {
          ...data,
          sender_name: data.sender_name || myName,
          sender_role: data.sender_role || myRole,
          sender_is_admin: myRole === 'Admin'
        }
      ]);
      fetchRooms(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Không thể gửi tin nhắn, vui lòng thử lại!');
    }
  };

  // Phân tích thông tin người gửi của từng tin nhắn
  const resolveMessageInfo = (msg) => {
    let parsedContext = null;
    if (msg.product_context) {
      try {
        parsedContext =
          typeof msg.product_context === 'string'
            ? JSON.parse(msg.product_context)
            : msg.product_context;
      } catch (e) {
        parsedContext = null;
      }
    }

    const isAiBot = Boolean(parsedContext?.is_ai);
    const senderId = Number(msg.sender_id);
    const isMe = !isAiBot && senderId === Number(staffId);

    if (isAiBot) {
      return {
        isMe: false,
        isAiBot: true,
        senderName: 'Trợ lý AI TCG',
        roleLabel: 'AI BOT',
        badgeBg: 'info',
        avatarBg: 'linear-gradient(135deg, #6f42c1, #432874)',
        bubbleStyle: {
          backgroundColor: '#f3f0ff',
          color: '#2b1b54',
          border: '1px solid #d0bfff',
          borderBottomLeftRadius: '4px'
        }
      };
    }

    if (isMe) {
      const meta = getRoleMeta(myRole, myRole === 'Admin');
      return {
        isMe: true,
        isAiBot: false,
        senderName: `Bạn (${myName})`,
        roleLabel: meta.label,
        badgeBg: 'light',
        badgeText: 'dark',
        avatarBg: meta.avatarBg,
        bubbleStyle: {
          background: 'linear-gradient(135deg, #dc3545, #b02a37)',
          color: '#ffffff',
          border: 'none',
          borderBottomRightRadius: '4px'
        }
      };
    }

    // Tin nhắn từ người khác (Khách hàng hoặc Đồng nghiệp Admin/Staff khác)
    const isRoomPartner = activeRoom && senderId === Number(activeRoom.user_id);
    const resolvedName =
      msg.sender_name ||
      parsedContext?.sender_name ||
      (isRoomPartner ? activeRoom.user_name : `User #${senderId}`);

    const resolvedRole =
      msg.sender_is_admin || msg.sender_role === 'Admin' || parsedContext?.sender_role === 'Admin'
        ? 'Admin'
        : msg.sender_role === 'Staff' || parsedContext?.sender_role === 'Staff'
        ? 'Staff'
        : isRoomPartner
        ? activeRoom.user_role || 'Customer'
        : 'Staff';

    const meta = getRoleMeta(resolvedRole, resolvedRole === 'Admin');
    const isColleague = resolvedRole === 'Admin' || resolvedRole === 'Staff';

    return {
      isMe: false,
      isAiBot: false,
      senderName: resolvedName,
      roleLabel: meta.label,
      badgeBg: meta.badgeBg,
      avatarBg: meta.avatarBg,
      bubbleStyle: isColleague
        ? {
            backgroundColor: '#eef6ff',
            color: '#1e293b',
            border: '1px solid #b6d4fe',
            borderBottomLeftRadius: '4px'
          }
        : {
            backgroundColor: '#ffffff',
            color: '#212529',
            border: '1px solid #dee2e6',
            borderBottomLeftRadius: '4px'
          }
    };
  };

  // Lọc danh sách phòng theo tab & từ khóa tìm kiếm
  const displayedRooms = rooms.filter((room) => {
    const role = room.user_is_admin || room.user_role === 'Admin' ? 'Admin' : (room.user_role || 'Customer');
    const isInternal = role === 'Admin' || role === 'Staff' || room.is_internal;

    if (filterTab === 'customer' && isInternal) return false;
    if (filterTab === 'internal' && !isInternal) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchName = (room.user_name || '').toLowerCase().includes(q);
      const matchEmail = (room.user_email || '').toLowerCase().includes(q);
      return matchName || matchEmail;
    }
    return true;
  });

  const myRoleMeta = getRoleMeta(myRole, myRole === 'Admin');

  return (
    <Container className="main-layout py-4">
      <Card className="border-0 shadow overflow-hidden" style={{ borderRadius: '14px', minHeight: '78vh' }}>
        {/* HEADER TRUNG TÂM CHAT & THÔNG TIN ACCOUNT ĐANG ĐĂNG NHẬP */}
        <div
          className="px-4 py-3 text-white d-flex flex-wrap justify-content-between align-items-center gap-3"
          style={{ background: 'linear-gradient(90deg, #1a1d20 0%, #2b3035 100%)', borderBottom: '3px solid #dc3545' }}
        >
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle bg-danger text-white shadow-sm"
              style={{ width: '40px', height: '40px' }}
            >
              <FaComments className="fs-5" />
            </div>
            <div>
              <h5 className="m-0 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                TRUNG TÂM HỖ TRỢ & CHAT TRỰC TUYẾN
              </h5>
              <div className="small text-white-50">
                Hệ thống phân luồng tài khoản khách hàng & nội bộ theo thời gian thực
              </div>
            </div>
          </div>

          {/* Khung hiển thị rõ đang dùng Account nào */}
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold small"
                style={{ width: '30px', height: '30px', background: myRoleMeta.avatarBg }}
              >
                {getInitials(myName)}
              </div>
              <div className="lh-sm">
                <div className="fw-bold small text-white d-flex align-items-center gap-1">
                  <span>{myName}</span>
                  <Badge bg={myRoleMeta.badgeBg} style={{ fontSize: '0.65rem' }}>
                    {myRoleMeta.label}
                  </Badge>
                </div>
                <div className="text-white-50" style={{ fontSize: '0.72rem' }}>
                  {myEmail}
                </div>
              </div>
            </div>

            <Button
              variant="outline-light"
              size="sm"
              className="fw-bold px-3 py-2 d-flex align-items-center gap-1"
              onClick={() => navigate('/admin')}
              style={{ borderRadius: '8px' }}
            >
              <FaChevronLeft /> DASHBOARD
            </Button>
          </div>
        </div>

        <Row className="g-0" style={{ height: 'calc(78vh - 76px)' }}>
          {/* CỘT TRÁI: DANH SÁCH NGƯỜI DÙNG (KHÔNG BAO GIỜ HIỆN BẢN THÂN) */}
          <Col md={4} className="border-end d-flex flex-column bg-white" style={{ height: '100%' }}>
            {/* Thanh tìm kiếm & Bộ lọc */}
            <div className="p-3 border-bottom bg-light">
              <div className="position-relative mb-2">
                <FaSearch
                  className="position-absolute text-muted"
                  style={{ top: '50%', left: '12px', transform: 'translateY(-50%)', fontSize: '0.85rem' }}
                />
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Tìm tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-4 shadow-none bg-white"
                  style={{ borderRadius: '8px', height: '36px' }}
                />
              </div>

              <div className="d-flex gap-1">
                <Button
                  size="sm"
                  variant={filterTab === 'all' ? 'danger' : 'outline-secondary'}
                  className="flex-fill fw-bold py-1"
                  style={{ fontSize: '0.75rem', borderRadius: '6px' }}
                  onClick={() => setFilterTab('all')}
                >
                  Tất cả ({rooms.length})
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === 'customer' ? 'success' : 'outline-secondary'}
                  className="flex-fill fw-bold py-1"
                  style={{ fontSize: '0.75rem', borderRadius: '6px' }}
                  onClick={() => setFilterTab('customer')}
                >
                  Khách hàng
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === 'internal' ? 'primary' : 'outline-secondary'}
                  className="flex-fill fw-bold py-1"
                  style={{ fontSize: '0.75rem', borderRadius: '6px' }}
                  onClick={() => setFilterTab('internal')}
                >
                  Nội bộ (Staff/Admin)
                </Button>
              </div>
            </div>

            {/* Danh sách cuộc trò chuyện */}
            <div className="flex-grow-1 overflow-auto">
              {displayedRooms.length === 0 ? (
                <div className="text-center text-muted p-4 my-4">
                  <FaComments className="fs-2 mb-2 opacity-50" />
                  <div className="small fw-bold">Không có cuộc trò chuyện nào</div>
                  <div style={{ fontSize: '0.78rem' }}>
                    Tài khoản của chính bạn ({myName}) đã được ẩn để tránh tự chat với bản thân.
                  </div>
                </div>
              ) : (
                displayedRooms.map((room) => {
                  const isSelected =
                    activeRoom &&
                    Number(activeRoom.id) === Number(room.id) &&
                    Number(activeRoom.user_id) === Number(room.user_id);
                  const partnerMeta = getRoleMeta(room.user_role, room.user_is_admin);

                  return (
                    <div
                      key={`${room.id}-${room.user_id}`}
                      onClick={() => setActiveRoom(room)}
                      className="p-3 border-bottom d-flex align-items-center gap-3 transition-all"
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#fff5f5' : '#ffffff',
                        borderLeft: isSelected ? '4px solid #dc3545' : '4px solid transparent'
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0 shadow-sm"
                        style={{
                          width: '44px',
                          height: '44px',
                          background: partnerMeta.avatarBg,
                          fontSize: '0.9rem'
                        }}
                      >
                        {getInitials(room.user_name)}
                      </div>

                      {/* Thông tin */}
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold text-dark text-truncate me-1" style={{ fontSize: '0.92rem' }}>
                            {room.user_name || `User #${room.user_id}`}
                          </span>
                          <Badge bg={partnerMeta.badgeBg} style={{ fontSize: '0.65rem' }}>
                            {partnerMeta.label}
                          </Badge>
                        </div>

                        <div className="text-muted text-truncate" style={{ fontSize: '0.76rem' }}>
                          {room.user_email}
                        </div>

                        {room.last_message && (
                          <div className="text-secondary text-truncate mt-1" style={{ fontSize: '0.78rem' }}>
                            💬 {room.last_message}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Col>

          {/* CỘT PHẢI: KHUNG HỘI THOẠI TRỰC TIẾP */}
          <Col md={8} className="d-flex flex-column bg-light" style={{ height: '100%' }}>
            {activeRoom && Number(activeRoom.user_id) !== Number(staffId) ? (
              <>
                {/* Header Người Đang Trò Chuyện Cùng */}
                {(() => {
                  const partnerMeta = getRoleMeta(activeRoom.user_role, activeRoom.user_is_admin);
                  return (
                    <div className="px-4 py-3 border-bottom bg-white d-flex align-items-center justify-content-between shadow-sm">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                          style={{
                            width: '44px',
                            height: '44px',
                            background: partnerMeta.avatarBg,
                            fontSize: '0.95rem'
                          }}
                        >
                          {getInitials(activeRoom.user_name)}
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold text-dark fs-6">
                              {activeRoom.user_name || `User #${activeRoom.user_id}`}
                            </span>
                            <Badge bg={partnerMeta.badgeBg} className="d-flex align-items-center">
                              {partnerMeta.icon} {partnerMeta.label}
                            </Badge>
                            <Badge bg="secondary" className="fw-normal">
                              Phòng #{activeRoom.id}
                            </Badge>
                          </div>
                          <div className="small text-muted">{activeRoom.user_email}</div>
                        </div>
                      </div>

                      <Badge bg="success" className="px-3 py-2 d-flex align-items-center gap-1 rounded-pill">
                        <FaCircle style={{ fontSize: '8px' }} /> Đang kết nối
                      </Badge>
                    </div>
                  );
                })()}

                {/* Danh sách tin nhắn */}
                <div
                  className="flex-grow-1 p-4 overflow-auto"
                  ref={chatBodyRef}
                  style={{ backgroundColor: '#f4f6f9', maxHeight: 'calc(78vh - 215px)' }}
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-muted my-5 py-4">
                      <FaComments className="fs-1 mb-2 opacity-25" />
                      <p className="mb-0 fw-bold">Chưa có tin nhắn nào trong cuộc trò chuyện này</p>
                      <small>Hãy gửi tin nhắn đầu tiên cho {activeRoom.user_name}!</small>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const info = resolveMessageInfo(msg);

                      return (
                        <div
                          key={msg.id || index}
                          className={`mb-3 d-flex align-items-end gap-2 ${
                            info.isMe ? 'justify-content-end' : 'justify-content-start'
                          }`}
                        >
                          {/* Avatar bên trái cho tin nhắn của người khác */}
                          {!info.isMe && (
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0 shadow-sm"
                              style={{
                                width: '34px',
                                height: '34px',
                                background: info.avatarBg,
                                fontSize: '0.75rem'
                              }}
                              title={info.senderName}
                            >
                              {info.isAiBot ? <FaRobot /> : getInitials(info.senderName)}
                            </div>
                          )}

                          {/* Bong bóng tin nhắn */}
                          <div
                            className="p-3 shadow-sm"
                            style={{
                              maxWidth: '72%',
                              borderRadius: '14px',
                              wordBreak: 'break-word',
                              ...info.bubbleStyle
                            }}
                          >
                            {/* Tên người gửi + Vai trò */}
                            <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                              <span
                                className="fw-bold"
                                style={{
                                  fontSize: '0.78rem',
                                  opacity: info.isMe ? 0.95 : 0.85
                                }}
                              >
                                {info.senderName}
                              </span>
                              <Badge
                                bg={info.badgeBg}
                                text={info.badgeText}
                                style={{ fontSize: '0.62rem' }}
                              >
                                {info.roleLabel}
                              </Badge>
                            </div>

                            {/* Nội dung tin nhắn */}
                            <div style={{ fontSize: '0.93rem', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                              {msg.message_text || msg.text}
                            </div>

                            {/* Thời gian */}
                            <div
                              className="text-end mt-1"
                              style={{ fontSize: '0.68rem', opacity: info.isMe ? 0.8 : 0.6 }}
                            >
                              {new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Ô nhập tin nhắn trả lời */}
                <Form onSubmit={handleSendMessage} className="p-3 border-top bg-white d-flex gap-2 align-items-center">
                  <Form.Control
                    type="text"
                    placeholder={`Nhắn tin tới ${activeRoom.user_name} với tư cách ${myName} (${myRole})...`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="shadow-none py-2 px-3"
                    style={{ borderRadius: '10px', backgroundColor: '#f8f9fa' }}
                  />
                  <Button
                    type="submit"
                    variant="danger"
                    disabled={!text.trim()}
                    className="px-4 py-2 fw-bold d-flex align-items-center gap-2 tcg-btn"
                    style={{ borderRadius: '10px' }}
                  >
                    <FaPaperPlane /> GỬI
                  </Button>
                </Form>
              </>
            ) : (
              <div className="text-center text-muted m-auto p-4">
                <FaComments className="fs-1 text-secondary mb-3 opacity-50" />
                <h5 className="fw-bold text-dark">Chọn một người dùng ở danh sách bên trái</h5>
                <p className="small text-muted mb-0">
                  Hệ thống đã tự động ẩn tài khoản của chính bạn ({myName}) để tránh tự chat với bản thân.
                </p>
              </div>
            )}
          </Col>
        </Row>
      </Card>
    </Container>
  );
};

export default StaffChat;
