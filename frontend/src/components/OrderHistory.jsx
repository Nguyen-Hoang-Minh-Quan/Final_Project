import React, { useEffect, useState } from 'react';
import { Container, Table, Badge } from 'react-bootstrap';
import axios from 'axios';
import '../styles/TCGStyles.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchOrders = async () => {
      if (userInfo?.token) {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          };
          
          // API lấy lịch sử đơn hàng của User đang đăng nhập
          const { data } = await axios.get('http://localhost:5000/api/orders/myorders', config);
          setOrders(data);
        } catch (error) {
          console.error("Lỗi lấy lịch sử đơn hàng:", error);
        }
      }
    };
    fetchOrders();
  }, [userInfo?.token]);

  return (
    <Container className="main-layout">
      <h2 className="section-title">LỊCH SỬ MUA HÀNG</h2>
      <Table responsive className="tcg-card bg-white shadow-sm mt-3">
        <thead className="bg-dark text-white">
          <tr>
            <th>MÃ ĐƠN</th>
            <th>NGÀY ĐẶT</th>
            <th>TỔNG TIỀN</th>
            <th>TRẠNG THÁI</th>
          </tr>
        </thead>
        <tbody>
          {orders && orders.length > 0 ? (
            orders.map(o => (
              // 1. Thay key o._id thành o.id chuẩn Sequelize
              <tr key={o.id}>
                <td>
                  {/* 2. Ép kiểu String đề phòng id là kiểu Number, dùng slice an toàn */}
                  #{o.id ? String(o.id).slice(-6).toUpperCase() : 'NEW'}
                </td>
                <td>
                  {o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
                </td>
                <td className="fw-bold text-danger">
                  {o.totalPrice ? Number(o.totalPrice).toLocaleString() : 0}đ
                </td>
                <td>
                  <Badge bg={o.status === 'Đã giao' ? 'success' : 'warning'}>
                    {o.status || 'Chờ xử lý'}
                  </Badge>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center text-muted py-4">
                Bạn chưa có đơn hàng nào cả!
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
};

export default OrderHistory;