import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  FaRobot,
  FaHeadset,
  FaClock,
  FaArrowRight
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import '../../styles/TCGStyles.css';

// Helper: Giải mã an toàn trường product_context của từng tin nhắn
const parseMessageContext = (rawContext) => {
  if (!rawContext) return null;
  try {
    return typeof rawContext === 'string' ? JSON.parse(rawContext) : rawContext;
  } catch (error) {
    return null;
  }
};

// Helper: Tách hoàn toàn tin nhắn thành 2 tab 'Live Support' (Người thật) và 'AI Log' (Lịch sử hỏi AI)
const splitRoomMessagesByChannel = (allMessages = []) => {
  const liveSupportMessages = [];
  const aiLogMessages = [];

  for (let i = 0; i < allMessages.length; i++) {
    const msg = allMessages[i];
    const ctx = parseMessageContext(msg.product_context);

    if (ctx?.channel === 'ai' || ctx?.is_ai === true || ctx?.is_ai_query === true) {
      aiLogMessages.push(msg);
      continue;
    }

    if (ctx?.channel === 'staff') {
      liveSupportMessages.push(msg);
      continue;
    }

    // Xử lý tương thích ngược cho tin nhắn cũ trước khi tách kênh
    const isStaffSender =
      msg.sender_is_admin === true ||
      msg.sender_role === 'Admin' ||
      msg.sender_role === 'Staff' ||
      ctx?.sender_role === 'Admin' ||
      ctx?.sender_role === 'Staff';

    if (isStaffSender) {
      liveSupportMessages.push(msg);
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
      aiLogMessages.push(msg);
    } else {
      liveSupportMessages.push(msg);
    }
  }

  return { liveSupportMessages, aiLogMessages };
};

const StaffChat = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'waiting' | 'customer' | 'internal'
  const [channelTab, setChannelTab] = useState('staff'); // 'staff' (Live Support) | 'ai' (AI Log)

  const chatBodyRef = useRef(null);

  // Thông tin tài khoản Staff / Admin đang đăng nhập
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const staffId = userInfo.id ? Number(userInfo.id) : null;
  const myName = userInfo.name || 'Staff';
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
      label: 'CUSTOMER',
      badgeBg: 'success',
      avatarBg: 'linear-gradient(135deg, #198754, #0f5132)',
      icon: <FaUser className="me-1" />
    };
  };

  // 1. Tải danh sách phòng chat (Đã được Backend ưu tiên khách chờ trả lời lên đầu)
  const fetchRooms = async (isInitial = false) => {
    if (!staffId) return;
    try {
      const { data } = await axiosClient.get(`/chat/admin/rooms?viewerId=${staffId}`);

      // Chốt chặn kép ở Frontend: Không bao giờ hiển thị phòng của chính mình
      const filtered = (Array.isArray(data) ? data : []).filter(
        (r) => Number(r.user_id) !== Number(staffId)
      );

      // Khử trùng lặp theo user_id
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

      // Đồng bộ lại thông tin phòng đang mở (cập nhật trạng thái waiting_for_staff mới nhất)
      setActiveRoom((prev) => {
        if (prev && Number(prev.user_id) !== Number(staffId)) {
          const updatedMatch = uniqueByUser.find(
            (r) => Number(r.id) === Number(prev.id) && Number(r.user_id) === Number(prev.user_id)
          );
          return updatedMatch || prev;
        }
        if (isInitial && uniqueByUser.length > 0) {
          return uniqueByUser[0];
        }
        return prev;
      });
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

  // Bảo vệ: Nếu activeRoom vô tình trùng với bản thân thì tự chuyển sang phòng hợp lệ đầu tiên
  useEffect(() => {
    if (activeRoom && Number(activeRoom.user_id) === Number(staffId)) {
      const firstValid = rooms.find((r) => Number(r.user_id) !== Number(staffId)) || null;
      setActiveRoom(firstValid);
    }
  }, [activeRoom, rooms, staffId]);

  const activeRoomId = activeRoom?.id;
  const activeRoomUserId = activeRoom?.user_id;

  // Mỗi khi đổi sang phòng khách hàng khác -> Mặc định mở tab 'Live Support' để Staff xử lý việc chính
  useEffect(() => {
    setChannelTab('staff');
  }, [activeRoomId, activeRoomUserId]);

  // 2. Lấy lịch sử tin nhắn khi chọn phòng chat
  useEffect(() => {
    if (activeRoomId && Number(activeRoomUserId) !== Number(staffId)) {
      const fetchMessages = async () => {
        try {
          const { data } = await axiosClient.get(`/chat/messages/${activeRoomId}`);
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
  }, [activeRoomId, activeRoomUserId, staffId]);

  // Phân tách tin nhắn của phòng hiện tại thành 2 luồng riêng biệt
  const { liveSupportMessages, aiLogMessages } = useMemo(() => {
    if (activeRoom?.is_internal) {
      return { liveSupportMessages: messages, aiLogMessages: [] };
    }
    return splitRoomMessagesByChannel(messages);
  }, [messages, activeRoom?.is_internal]);

  const activeMessageList =
    !activeRoom?.is_internal && channelTab === 'ai' ? aiLogMessages : liveSupportMessages;

  // Tự động cuộn xuống cuối khi có tin nhắn mới hoặc khi chuyển tab
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [activeMessageList.length, activeRoom?.id, channelTab]);

  // 3. Gửi tin nhắn trả lời khách hàng (Luôn gắn nhãn channel: 'staff')
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeRoom || !staffId) return;

    if (Number(activeRoom.user_id) === Number(staffId)) {
      toast.warning('You cannot send a message to yourself!');
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
          channel: 'staff',
          is_ai: false,
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
      toast.error('Cannot send message, please try again!');
    }
  };

  // Phân tích thông tin người gửi cho tab Live Support (Người thật)
  const resolveLiveMessageInfo = (msg) => {
    const parsedContext = parseMessageContext(msg.product_context);
    const senderId = Number(msg.sender_id);
    const isMe = senderId === Number(staffId);

    if (isMe) {
      const meta = getRoleMeta(myRole, myRole === 'Admin');
      return {
        isMe: true,
        senderName: `You (${myName})`,
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

  // Đếm tổng số phòng khách đang chờ nhân viên trả lời
  const waitingCount = useMemo(
    () => rooms.filter((r) => Boolean(r.waiting_for_staff)).length,
    [rooms]
  );

  // Lọc danh sách phòng theo tab & từ khóa tìm kiếm
  const displayedRooms = rooms.filter((room) => {
    const role =
      room.user_is_admin || room.user_role === 'Admin' ? 'Admin' : (room.user_role || 'Customer');
    const isInternal = role === 'Admin' || role === 'Staff' || room.is_internal;

    if (filterTab === 'waiting' && !room.waiting_for_staff) return false;
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
      <Card className="border-0 shadow overflow-hidden" style={{ borderRadius: '14px', minHeight: '80vh' }}>
        {/* HEADER TRUNG TÂM HỖ TRỢ KHÁCH HÀNG */}
        <div
          className="px-4 py-3 text-white d-flex flex-wrap justify-content-between align-items-center gap-3"
          style={{
            background: 'linear-gradient(90deg, #1a1d20 0%, #2b3035 100%)',
            borderBottom: '3px solid #dc3545'
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle bg-danger text-white shadow-sm"
              style={{ width: '42px', height: '42px' }}
            >
              <FaHeadset className="fs-5" />
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="m-0 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  CUSTOMER SUPPORT & LIVE CHAT
                </h5>
                {waitingCount > 0 && (
                  <Badge bg="warning" text="dark" className="px-2 py-1">
                    {waitingCount} Waiting for Reply
                  </Badge>
                )}
              </div>
              <div className="small text-white-50">
                Separated human support queue and read-only AI assistant logs
              </div>
            </div>
          </div>

          {/* Thông tin tài khoản Staff/Admin đang đăng nhập */}
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
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

        <Row className="g-0" style={{ height: 'calc(80vh - 78px)' }}>
          {/* CỘT TRÁI: HÀNG ĐỢI PHÒNG CHAT */}
          <Col md={4} className="border-end d-flex flex-column bg-white" style={{ height: '100%' }}>
            {/* Thanh tìm kiếm & Bộ lọc hàng đợi */}
            <div className="p-3 border-bottom bg-light">
              <div className="position-relative mb-2">
                <FaSearch
                  className="position-absolute text-muted"
                  style={{ top: '50%', left: '12px', transform: 'translateY(-50%)', fontSize: '0.85rem' }}
                />
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Search customer name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-4 shadow-none bg-white"
                  style={{ borderRadius: '8px', height: '36px' }}
                />
              </div>

              <div className="d-flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant={filterTab === 'all' ? 'danger' : 'outline-secondary'}
                  className="flex-fill fw-bold py-1"
                  style={{ fontSize: '0.72rem', borderRadius: '6px' }}
                  onClick={() => setFilterTab('all')}
                >
                  All ({rooms.length})
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === 'waiting' ? 'warning' : 'outline-secondary'}
                  className="flex-fill fw-bold py-1"
                  style={{ fontSize: '0.72rem', borderRadius: '6px' }}
                  onClick={() => setFilterTab('waiting')}
                >
                  Waiting ({waitingCount})
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === 'customer' ? 'success' : 'outline-secondary'}
                  className="flex-fill fw-bold py-1"
                  style={{ fontSize: '0.72rem', borderRadius: '6px' }}
                  onClick={() => setFilterTab('customer')}
                >
                  Customers
                </Button>
                <Button
                  size="sm"
                  variant={filterTab === 'internal' ? 'primary' : 'outline-secondary'}
                  className="flex-fill fw-bold py-1"
                  style={{ fontSize: '0.72rem', borderRadius: '6px' }}
                  onClick={() => setFilterTab('internal')}
                >
                  Internal
                </Button>
              </div>
            </div>

            {/* Danh sách phòng chat */}
            <div className="flex-grow-1 overflow-auto">
              {displayedRooms.length === 0 ? (
                <div className="text-center text-muted p-4 my-4">
                  <FaComments className="fs-2 mb-2 opacity-50" />
                  <div className="small fw-bold">No matching conversations</div>
                  <div style={{ fontSize: '0.78rem' }}>
                    {filterTab === 'waiting'
                      ? 'All customer inquiries have been answered!'
                      : `Your own account (${myName}) is hidden from this list.`}
                  </div>
                </div>
              ) : (
                displayedRooms.map((room) => {
                  const isSelected =
                    activeRoom &&
                    Number(activeRoom.id) === Number(room.id) &&
                    Number(activeRoom.user_id) === Number(room.user_id);
                  const partnerMeta = getRoleMeta(room.user_role, room.user_is_admin);
                  const isWaiting = Boolean(room.waiting_for_staff);
                  const isAiOnly =
                    !room.is_internal &&
                    Number(room.staff_message_count || 0) === 0 &&
                    Number(room.ai_message_count || 0) > 0;

                  return (
                    <div
                      key={`${room.id}-${room.user_id}`}
                      onClick={() => setActiveRoom(room)}
                      className="p-3 border-bottom d-flex align-items-center gap-3"
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected
                          ? '#fff5f5'
                          : isWaiting
                          ? '#fffdf2'
                          : '#ffffff',
                        borderLeft: isSelected
                          ? '4px solid #dc3545'
                          : isWaiting
                          ? '4px solid #ffc107'
                          : '4px solid transparent'
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

                      {/* Thông tin khách hàng & dòng xem trước tách bạch AI / Nhân viên */}
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between align-items-center mb-1 gap-1">
                          <span
                            className="fw-bold text-dark text-truncate"
                            style={{ fontSize: '0.9rem' }}
                          >
                            {room.user_name || `User #${room.user_id}`}
                          </span>
                          <div className="d-flex align-items-center gap-1 flex-shrink-0">
                            {isWaiting && (
                              <Badge
                                bg="warning"
                                text="dark"
                                className="d-flex align-items-center gap-1"
                                style={{ fontSize: '0.62rem' }}
                              >
                                <FaClock size={9} /> WAITING
                              </Badge>
                            )}
                            {isAiOnly && (
                              <Badge
                                style={{
                                  backgroundColor: '#ede9fe',
                                  color: '#5b21b6',
                                  fontSize: '0.62rem'
                                }}
                              >
                                🤖 AI ONLY
                              </Badge>
                            )}
                            <Badge bg={partnerMeta.badgeBg} style={{ fontSize: '0.62rem' }}>
                              {partnerMeta.label}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                          {room.user_email}
                        </div>

                        {room.last_staff_message ? (
                          <div
                            className={`text-truncate mt-1 ${
                              isWaiting ? 'fw-bold text-dark' : 'text-secondary'
                            }`}
                            style={{ fontSize: '0.78rem' }}
                          >
                            💬 {room.last_staff_message}
                          </div>
                        ) : room.last_ai_message ? (
                          <div
                            className="text-muted text-truncate mt-1 fst-italic"
                            style={{ fontSize: '0.75rem' }}
                          >
                            🤖 [AI Log] {room.last_ai_message}
                          </div>
                        ) : (
                          <div className="text-muted mt-1" style={{ fontSize: '0.74rem' }}>
                            No messages yet
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Col>

          {/* CỘT PHẢI: KHUNG HỘI THOẠI TRỰC TIẾP & TAB AI LOG */}
          <Col md={8} className="d-flex flex-column bg-light" style={{ height: '100%' }}>
            {activeRoom && Number(activeRoom.user_id) !== Number(staffId) ? (
              <>
                {/* Header thông tin đối phương */}
                {(() => {
                  const partnerMeta = getRoleMeta(activeRoom.user_role, activeRoom.user_is_admin);
                  return (
                    <div className="px-4 py-3 border-bottom bg-white d-flex flex-wrap align-items-center justify-content-between gap-2 shadow-sm">
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
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="fw-bold text-dark fs-6">
                              {activeRoom.user_name || `User #${activeRoom.user_id}`}
                            </span>
                            <Badge bg={partnerMeta.badgeBg} className="d-flex align-items-center">
                              {partnerMeta.icon} {partnerMeta.label}
                            </Badge>
                            <Badge bg="secondary" className="fw-normal">
                              Room #{activeRoom.id}
                            </Badge>
                            {activeRoom.waiting_for_staff && (
                              <Badge bg="warning" text="dark">
                                ● Waiting for Staff Reply
                              </Badge>
                            )}
                          </div>
                          <div className="small text-muted">{activeRoom.user_email}</div>
                        </div>
                      </div>

                      <Badge
                        bg="success"
                        className="px-3 py-2 d-flex align-items-center gap-1 rounded-pill"
                      >
                        <FaCircle style={{ fontSize: '8px' }} /> Active Session
                      </Badge>
                    </div>
                  );
                })()}

                {/* THANH CHUYỂN 2 TAB TÁCH BIỆT CHO PHÒNG CỦA CUSTOMER: LIVE SUPPORT vs AI LOG */}
                {!activeRoom.is_internal && (
                  <div className="px-4 py-2 bg-white border-bottom d-flex align-items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setChannelTab('staff')}
                      className={`btn btn-sm fw-bold px-3 py-2 d-flex align-items-center gap-2 ${
                        channelTab === 'staff' ? 'btn-danger text-white shadow-sm' : 'btn-light text-secondary border'
                      }`}
                      style={{ borderRadius: '8px', fontSize: '0.82rem' }}
                    >
                      <FaHeadset />
                      <span>Live Support ({liveSupportMessages.length})</span>
                      {activeRoom.waiting_for_staff && (
                        <Badge bg="warning" text="dark" pill>
                          Reply Needed
                        </Badge>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setChannelTab('ai')}
                      className="btn btn-sm fw-bold px-3 py-2 d-flex align-items-center gap-2"
                      style={{
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        backgroundColor: channelTab === 'ai' ? '#6d28d9' : '#f8f9fa',
                        color: channelTab === 'ai' ? '#ffffff' : '#5b21b6',
                        border: channelTab === 'ai' ? '1px solid #6d28d9' : '1px solid #d8b4fe'
                      }}
                    >
                      <FaRobot />
                      <span>AI Log ({aiLogMessages.length})</span>
                    </button>
                  </div>
                )}

                {/* Banner giải thích khi Staff đang xem tab AI Log */}
                {!activeRoom.is_internal && channelTab === 'ai' && (
                  <div
                    className="px-4 py-2 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2"
                    style={{ backgroundColor: '#f3e8ff', color: '#4c1d95', fontSize: '0.8rem' }}
                  >
                    <span>
                      🤖 <strong>AI Conversation Log:</strong> Read-only history of questions{' '}
                      <strong>{activeRoom.user_name}</strong> asked the AI Bot.
                    </span>
                    <span className="badge bg-white text-dark border">Read-Only</span>
                  </div>
                )}

                {/* VÙNG HIỂN THỊ TIN NHẮN THEO TAB ĐANG CHỌN */}
                <div
                  className="flex-grow-1 p-4 overflow-auto"
                  ref={chatBodyRef}
                  style={{
                    backgroundColor:
                      !activeRoom.is_internal && channelTab === 'ai' ? '#f7f5ff' : '#f4f6f9'
                  }}
                >
                  {activeMessageList.length === 0 ? (
                    <div className="text-center text-muted my-5 py-4">
                      {!activeRoom.is_internal && channelTab === 'ai' ? (
                        <>
                          <FaRobot className="fs-1 mb-2 opacity-25" style={{ color: '#6d28d9' }} />
                          <p className="mb-1 fw-bold text-dark">No AI Assistant History</p>
                          <small>
                            {activeRoom.user_name} has not asked the AI Assistant any questions yet.
                          </small>
                        </>
                      ) : (
                        <>
                          <FaHeadset className="fs-1 mb-2 opacity-25 text-danger" />
                          <p className="mb-1 fw-bold text-dark">
                            No Live Support Messages Yet
                          </p>
                          <small>
                            {aiLogMessages.length > 0
                              ? `${activeRoom.user_name} has only used the AI Bot (${aiLogMessages.length} messages in AI Log). You can still message them directly below!`
                              : `Send the first message to ${activeRoom.user_name} below!`}
                          </small>
                        </>
                      )}
                    </div>
                  ) : !activeRoom.is_internal && channelTab === 'ai' ? (
                    /* HIỂN THỊ RÕ RÀNG CẶP HỎI - ĐÁP TRONG TAB AI LOG */
                    aiLogMessages.map((msg, index) => {
                      const ctx = parseMessageContext(msg.product_context);
                      const isBotReply = Boolean(ctx?.is_ai);

                      return (
                        <div
                          key={msg.id || index}
                          className={`mb-3 d-flex align-items-end gap-2 ${
                            isBotReply ? 'justify-content-start' : 'justify-content-end'
                          }`}
                        >
                          {isBotReply && (
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm flex-shrink-0"
                              style={{
                                width: '36px',
                                height: '36px',
                                background: 'linear-gradient(135deg, #6d28d9, #4c1d95)'
                              }}
                              title="TCG AI Bot"
                            >
                              <FaRobot />
                            </div>
                          )}

                          <div
                            className="p-3 shadow-sm"
                            style={{
                              maxWidth: '75%',
                              borderRadius: '14px',
                              wordBreak: 'break-word',
                              backgroundColor: isBotReply ? '#ffffff' : '#ede9fe',
                              color: isBotReply ? '#1f2937' : '#2e1065',
                              border: isBotReply ? '1px solid #d8b4fe' : '1px solid #c4b5fd',
                              borderLeft: isBotReply ? '4px solid #7c3aed' : '1px solid #c4b5fd',
                              borderRight: isBotReply ? '1px solid #d8b4fe' : '4px solid #6d28d9'
                            }}
                          >
                            <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                              <span className="fw-bold" style={{ fontSize: '0.78rem' }}>
                                {isBotReply
                                  ? '🤖 TCG AI Assistant'
                                  : `👤 ${activeRoom.user_name || 'Customer'}`}
                              </span>
                              <Badge
                                style={{
                                  backgroundColor: isBotReply ? '#6d28d9' : '#4c1d95',
                                  fontSize: '0.62rem'
                                }}
                              >
                                {isBotReply ? 'AI BOT REPLY' : 'ASKED AI BOT'}
                              </Badge>
                            </div>

                            <div
                              style={{
                                fontSize: '0.92rem',
                                lineHeight: 1.45,
                                whiteSpace: 'pre-line'
                              }}
                            >
                              {msg.message_text || msg.text}
                            </div>

                            <div
                              className="text-end mt-1"
                              style={{ fontSize: '0.68rem', opacity: 0.65 }}
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
                  ) : (
                    /* HIỂN THỊ TIN NHẮN NGƯỜI THẬT TRONG TAB LIVE SUPPORT / INTERNAL */
                    liveSupportMessages.map((msg, index) => {
                      const info = resolveLiveMessageInfo(msg);

                      return (
                        <div
                          key={msg.id || index}
                          className={`mb-3 d-flex align-items-end gap-2 ${
                            info.isMe ? 'justify-content-end' : 'justify-content-start'
                          }`}
                        >
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
                              {getInitials(info.senderName)}
                            </div>
                          )}

                          <div
                            className="p-3 shadow-sm"
                            style={{
                              maxWidth: '72%',
                              borderRadius: '14px',
                              wordBreak: 'break-word',
                              ...info.bubbleStyle
                            }}
                          >
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

                            <div
                              style={{
                                fontSize: '0.93rem',
                                lineHeight: 1.45,
                                whiteSpace: 'pre-line'
                              }}
                            >
                              {msg.message_text || msg.text}
                            </div>

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

                {/* THANH NHẬP LIỆU DƯỚI CÙNG: Ở tab AI Log thì hiện nút chuyển sang Live Support để trả lời */}
                {!activeRoom.is_internal && channelTab === 'ai' ? (
                  <div className="p-3 border-top bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <span className="text-muted small">
                      Want to message <strong>{activeRoom.user_name}</strong> personally?
                    </span>
                    <Button
                      variant="danger"
                      size="sm"
                      className="fw-bold px-3 py-2 d-flex align-items-center gap-2 tcg-btn"
                      onClick={() => setChannelTab('staff')}
                    >
                      Switch to Live Support to Reply <FaArrowRight size={12} />
                    </Button>
                  </div>
                ) : (
                  <Form
                    onSubmit={handleSendMessage}
                    className="p-3 border-top bg-white d-flex gap-2 align-items-center"
                  >
                    <Form.Control
                      type="text"
                      placeholder={`Reply to ${activeRoom.user_name} in Live Support as ${myName} (${myRole})...`}
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
                      <FaPaperPlane /> SEND
                    </Button>
                  </Form>
                )}
              </>
            ) : (
              <div className="text-center text-muted m-auto p-4">
                <FaComments className="fs-1 text-secondary mb-3 opacity-50" />
                <h5 className="fw-bold text-dark">Select a conversation on the left</h5>
                <p className="small text-muted mb-0">
                  Customers waiting for a human reply are automatically prioritized at the top.
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
