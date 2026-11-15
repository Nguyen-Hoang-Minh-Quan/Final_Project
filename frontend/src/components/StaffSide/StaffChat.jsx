import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaComments, FaPaperPlane, FaChevronLeft, FaUser, FaCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import '../../styles/TCGStyles.css';

const StaffChat = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  
  const chatBodyRef = useRef(null);

  // Lấy thông tin Staff đang đăng nhập từ localStorage
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const staffId = userInfo ? userInfo.id : 1;

  // 1. Tải danh sách phòng chat (Có tham số isInitial để chỉ tự chọn phòng ở lần tải đầu tiên)
  const fetchRooms = async (isInitial = false) => {
    try {
      const { data } = await axiosClient.get('/chat/admin/rooms');
      setRooms(data);
      // Chỉ tự động chọn phòng đầu tiên khi vào trang và chưa có phòng nào được active
      if (isInitial && data.length > 0) {
        setActiveRoom(data[0]);
      }
    } catch (error) {
      console.error("Error loading chat room list:", error);
    }
  };

  useEffect(() => {
    // Gọi lần đầu tiên khi mount component
    fetchRooms(true);

    // Cập nhật danh sách phòng định kỳ mỗi 5 giây (Không truyền isInitial để tránh bị giật/đổi phòng đang xem)
    const interval = setInterval(() => fetchRooms(false), 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. Lấy lịch sử tin nhắn khi Staff click chọn phòng chat cụ thể
  useEffect(() => {
    if (activeRoom) {
      const fetchMessages = async () => {
        try {
          const { data } = await axiosClient.get(`/chat/messages/${activeRoom.id}`);
          setMessages(data);
        } catch (error) {
          console.error("Error loading message history:", error);
        }
      };
      fetchMessages();

      // Cập nhật tin nhắn của phòng đang mở mỗi 3 giây
      const msgInterval = setInterval(fetchMessages, 3000);
      return () => clearInterval(msgInterval);
    }
  }, [activeRoom]);

  // Tự động cuộn xuống đáy khung chat
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // 3. Gửi tin nhắn tư vấn từ Staff
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeRoom) return;

    const messageText = text;
    setText('');

    try {
      const { data } = await axiosClient.post('/chat/message', {
        room_id: activeRoom.id,
        sender_id: staffId,
        message_text: messageText,
        product_context: null
      });

      setMessages((prev) => [...prev, data]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send response!");
    }
  };

  return (
    <Container className="main-layout py-4">
      <Card className="border-0 shadow-sm overflow-hidden" style={{ minHeight: '75vh' }}>
        {/* Header Thanh Quản Lý Chat */}
        <div className="p-3 bg-dark text-white d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <FaComments className="fs-4 text-warning" />
            <h5 className="m-0 fw-bold text-uppercase">ONLINE SUPPORT CHAT ROOM(STAFF)</h5>
          </div>
          <Button variant="outline-light" size="sm" className="tcg-btn" onClick={() => navigate('/admin')}>
            <FaChevronLeft className="me-1" /> BACK TO DASHBOARD
          </Button>
        </div>

        <Row className="g-0" style={{ height: 'calc(75vh - 65px)' }}>
          {/* Cột trái: Danh sách phòng chat của khách hàng */}
          <Col md={4} sm={5} className="border-end bg-light overflow-auto" style={{ height: '100%' }}>
            <div className="p-3 border-bottom bg-white fw-bold text-uppercase small text-muted">
              Customers Needing Support ({rooms.length})
            </div>
            {rooms.length === 0 ? (
              <div className="text-center text-muted p-4 small">No conversations available.</div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  className={`p-3 border-bottom transition-all ${
                    activeRoom?.id === room.id ? 'bg-danger text-white' : 'bg-white text-dark'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold fs-6">
                      <FaUser className="me-2 fs-6" />
                      {room.user_name || `Customer #${room.user_id}`}
                    </span>
                    <Badge 
                      bg={activeRoom?.id === room.id ? 'light' : 'secondary'} 
                      text={activeRoom?.id === room.id ? 'dark' : 'white'} 
                      className="small"
                    >
                      Room #{room.id}
                    </Badge>
                  </div>
                  <div className={`small text-truncate ${activeRoom?.id === room.id ? 'text-light' : 'text-muted'}`}>
                    {room.user_email || 'Support Request'}
                  </div>
                </div>
              ))
            )}
          </Col>

          {/* Cột phải: Khung hội thoại trực tiếp */}
          <Col md={8} sm={7} className="d-flex flex-column bg-white" style={{ height: '100%' }}>
            {activeRoom ? (
              <>
                {/* Info Bar Khách Hàng */}
                <div className="p-3 border-bottom bg-light d-flex align-items-center justify-content-between">
                  <div>
                    <strong className="text-dark fs-6">
                      Chat with: {activeRoom.user_name || `Customer #${activeRoom.user_id}`}
                    </strong>
                    <div className="small text-muted">{activeRoom.user_email}</div>
                  </div>
                  <Badge bg="success" className="d-flex align-items-center gap-1">
                    <FaCircle style={{ fontSize: '8px' }} /> Online
                  </Badge>
                </div>

                {/* Nội dung tin nhắn */}
                <div className="flex-grow-1 p-3 overflow-auto" ref={chatBodyRef} style={{ maxHeight: 'calc(75vh - 190px)' }}>
                  {messages.length === 0 ? (
                    <div className="text-center text-muted my-5">No messages in this room.</div>
                  ) : (
                    messages.map((msg, index) => {
                      const isStaffMsg = Number(msg.sender_id) === Number(staffId) || Number(msg.sender_id) === 1;
                      return (
                        <div key={msg.id || index} className={`mb-3 d-flex ${isStaffMsg ? 'justify-content-end' : 'justify-content-start'}`}>
                          <div
                            className={`p-3 rounded shadow-sm ${
                              isStaffMsg ? 'bg-danger text-white' : 'bg-light text-dark border'
                            }`}
                            style={{ maxWidth: '75%', wordBreak: 'break-word' }}
                          >
                            <div className="small fw-bold mb-1 opacity-75">
                              {isStaffMsg ? 'Nhân viên TCG Support' : (activeRoom.user_name || 'Khách hàng')}
                            </div>
                            <div>{msg.message_text || msg.text}</div>
                            <div className="text-end mt-1" style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                              {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Form Nhập Phản Hồi */}
                <Form onSubmit={handleSendMessage} className="p-3 border-top bg-light d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Enter the response for the customer..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="shadow-none"
                  />
                  <Button type="submit" variant="danger" className="px-4 fw-bold d-flex align-items-center gap-1 tcg-btn">
                    <FaPaperPlane /> SEND
                  </Button>
                </Form>
              </>
            ) : (
              <div className="text-center text-muted m-auto">
                <FaComments className="fs-1 text-secondary mb-2" />
                <h5>Select a conversation from the list on the left to start providing support</h5>
              </div>
            )}
          </Col>
        </Row>
      </Card>
    </Container>
  );
};

export default StaffChat;