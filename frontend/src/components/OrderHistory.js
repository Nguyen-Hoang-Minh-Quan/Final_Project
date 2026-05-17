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
        
        // Sửa URL thành /api/orders/myorders
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
          <tr><th>MÃ ĐƠN</th><th>NGÀY ĐẶT</th><th>TỔNG TIỀN</th><th>TRẠNG THÁI</th></tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o._id}>
              <td>#{o._id.slice(-6)}</td>
              <td>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
              <td className="fw-bold text-danger">{o.totalPrice.toLocaleString()}đ</td>
              <td><Badge bg={o.status === 'Đã giao' ? 'success' : 'warning'}>{o.status || 'Chờ xử lý'}</Badge></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};
export default OrderHistory;