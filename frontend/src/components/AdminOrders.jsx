import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Form, Card, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient'; 
import { FaChevronLeft, FaClipboardList, FaRegMoneyBillAlt } from 'react-icons/fa';
import '../styles/TCGStyles.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  // --- HÀM LẤY DANH SÁCH ĐƠN HÀNG CÓ KÈM TOKEN ---
  const getOrders = async () => {
    try {
      const { data } = await axiosClient.get('/orders/all');
      
      // 💡 DEBUG: Giúp Quân check nhanh trên F12 Console xem cấu trúc thực tế Server trả về
      console.log("DỮ LIỆU ĐƠN HÀNG ADMIN NHẬN ĐƯỢC:", data);
      
      // Phòng hờ trường hợp Backend bọc mảng trong 1 object (ví dụ: { success: true, orders: [...] })
      if (Array.isArray(data)) {
        setOrders(data);
      } else if (data && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else if (data && Array.isArray(data.data)) {
        setOrders(data.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Lỗi tải đơn hàng:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        alert("Phiên đăng nhập hết hạn hoặc bạn không có quyền truy cập Admin!");
      }
    }
  };

  useEffect(() => {
    getOrders();
  }, []);

  // --- HÀM CẬP NHẬT TRẠNG THÁI CÓ KÈM TOKEN ---
  const updateStatus = async (id, status) => {
    try {
      await axiosClient.put(`/orders/${id}/status`, { status });
      getOrders(); // Reload lại danh sách sau khi cập nhật thành công
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      alert("Lỗi cập nhật trạng thái đơn hàng!");
    }
  };

  return (
    <Container className="main-layout">
      <Card className="border-0 shadow-sm p-4">
        <Row className="align-items-center mb-4">
          <Col md={8}>
            <div className="d-flex align-items-center">
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="me-3 border-0 tcg-btn" 
                onClick={() => navigate('/admin')}
              >
                <FaChevronLeft className="me-1"/> QUAY LẠI
              </Button>
              <div>
                <h2 className="fw-bold mb-0">
                  <FaClipboardList className="text-danger me-2"/>QUẢN LÝ ĐƠN HÀNG
                </h2>
                <small className="text-muted">Theo dõi và cập nhật trạng thái vận chuyển</small>
              </div>
            </div>
          </Col>
        </Row>

        <Table responsive hover className="admin-table border-top">
          <thead>
            <tr>
              <th>MÃ ĐƠN</th>
              <th>KHÁCH HÀNG</th>
              <th className="text-center">TỔNG TIỀN</th>
              <th className="text-center"><FaRegMoneyBillAlt className="me-1"/>PHƯƠNG THỨC</th>
              <th className="text-center">TRẠNG THÁI</th>
              <th className="text-end" style={{ width: '200px' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => {
              const orderId = o.id || o._id;
              return (
                <tr key={orderId}>
                  <td className="fw-bold">#{String(orderId).slice(-6).toUpperCase()}</td>
                  <td>
                    <div className="fw-bold text-dark">{o.user?.name || o.userName || "Khách hàng"}</div>
                    <small className="text-muted">{o.phone}</small>
                  </td>
                  <td className="text-center fw-bold text-danger">
                    {Number(o.totalPrice || o.total_price || 0).toLocaleString()}đ
                  </td>
                  <td className="text-center">
                    <Badge bg={o.paymentMethod === 'COD' ? 'secondary' : 'info'} className="px-3 py-2">
                      {o.paymentMethod || 'COD'}
                    </Badge>
                  </td>
                  <td className="text-center">
                    <Badge 
                      bg={o.status === 'Đã giao' ? 'success' : o.status === 'Đang giao' ? 'warning' : 'danger'}
                      className="px-3 py-2"
                    >
                      {o.status || 'Chờ xử lý'}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Form.Select 
                      size="sm" 
                      className="tcg-input" 
                      value={o.status || ''}
                      onChange={(e) => updateStatus(orderId, e.target.value)}
                    >
                      <option value="" disabled>Cập nhật trạng thái...</option>
                      <option value="Chờ xử lý">Chờ xử lý</option>
                      <option value="Đang giao">Đang giao</option>
                      <option value="Đã giao">Đã giao</option>
                      <option value="Đã hủy">Hủy đơn</option>
                    </Form.Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        
        {orders.length === 0 && (
          <div className="text-center py-5 text-muted">
            Chưa có đơn hàng nào trong hệ thống.
          </div>
        )}
      </Card>
    </Container>
  );
};

export default AdminOrders;