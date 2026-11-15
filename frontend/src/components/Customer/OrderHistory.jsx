import React, { useEffect, useState } from 'react';
import { Container, Table, Badge, Card, Button, Row, Col } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient';
import { FaHistory, FaBoxOpen, FaTrashAlt, FaReceipt, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';
import OrderTimeline from './OrderTimeline';
import '../../styles/TCGStyles.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [activeTrackOrder, setActiveTrackOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // HÀM PHỤC VỤ CHO THAO TÁC HỦY ĐƠN VÀ ĐỒNG BỘ LẠI DỮ LIỆU
  const reloadOrdersAndDetail = async (orderId) => {
    if (!userInfo?.token) return;
    try {
      const currentConfig = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      
      // 1. Tải lại danh sách đơn hàng mới nhất
      const { data } = await axiosClient.get('/orders/myorders', currentConfig);
      setOrders(data);
      
      // 2. Tải lại chi tiết của đơn vừa thao tác để cập nhật trạng thái mới nhất
      setLoadingDetail(true);
      const detailRes = await axiosClient.get(`/orders/${orderId}`, currentConfig);
      setActiveTrackOrder(detailRes.data);
    } catch (error) {
      console.error("Error while re-syncing order data:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  //KHỐI USEEFFECT ĐƯỢC CHUẨN HÓA KHÔNG THIẾU DEPENDENCY (KHÔNG GÂY WARNING ESLINT)
  useEffect(() => {
    const fetchOrdersAndInitialDetail = async () => {
      if (userInfo?.token) {
        try {
          const innerConfig = {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          };
          
          // Lấy danh sách tổng quan lịch sử đơn hàng
          const { data } = await axiosClient.get('/orders/myorders', innerConfig);
          setOrders(data);
          
          // Mặc định nạp chi tiết đơn hàng đầu tiên (đơn mới nhất) để hiển thị danh sách sản phẩm
          if (data && data.length > 0) {
            setLoadingDetail(true);
            const detailRes = await axiosClient.get(`/orders/${data[0].id}`, innerConfig);
            setActiveTrackOrder(detailRes.data);
          }
        } catch (error) {
          console.error("Error retrieving initial order history:", error);
        } finally {
          setLoadingDetail(false);
        }
      }
    };

    fetchOrdersAndInitialDetail();
  }, [userInfo?.token]); // Chỉ kích hoạt lại khi token thay đổi

  // HÀM TÁCH RIÊNG KHI CLICK VÀO CARD ĐỂ XEM CHI TIẾT ĐƠN KHÁC
  const handleSelectOrderCard = async (orderId) => {
    if (!userInfo?.token) return;
    try {
      setLoadingDetail(true);
      const innerConfig = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      const { data } = await axiosClient.get(`/orders/${orderId}`, innerConfig);
      setActiveTrackOrder(data);
    } catch (error) {
      console.error("Error fetching selected order details:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  // CHỨC NĂNG HỦY ĐƠN HÀNG DÀNH CHO NGƯỜI DÙNG
  const cancelOrderHandler = async (orderId) => {
    if (window.confirm(`Are you sure you want to cancel order #${orderId}?`)) {
      try {
        const innerConfig = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };
        // Gửi trạng thái "Đã hủy" tương thích với logic xử lý hoàn kho ở Backend của bạn
        await axiosClient.put(`/orders/${orderId}/status`, { status: "Cancelled" }, innerConfig);
        alert("Order cancelled successfully!");
        
        // Gọi hàm reload để đồng bộ lại giao diện
        await reloadOrdersAndDetail(orderId);
      } catch (error) {
        console.error("Error while cancelling order:", error);
        alert(error.response?.data?.message || "Cannot cancel order at this time.");
      }
    }
  };

  // CHUẨN HÓA CÁC BADGE HIỂN THỊ TRẠNG THÁI THEO TEXT DỮ LIỆU BACKEND
  const getStatusBadge = (status) => {
    const currentStatus = status ? String(status).trim() : 'Pending processing';
    if (currentStatus === 'Out for delivery' || currentStatus === 'Out for delivery' || currentStatus === '1') {
      return <Badge bg="info" text="dark" className="text-uppercase px-2 py-1">Out for delivery</Badge>;
    } else if (currentStatus === 'Delivered' || currentStatus === 'Delivered' || currentStatus === '2') {
      return <Badge bg="success" className="text-uppercase px-2 py-1">Delivered</Badge>;
    } else if (currentStatus === 'Cancelled' || currentStatus === 'Cancelled' || currentStatus === '3') {
      return <Badge bg="secondary" className="text-uppercase px-2 py-1">Cancelled</Badge>;
    } else {
      return <Badge bg="warning" text="dark" className="text-uppercase px-2 py-1">Pending processing</Badge>;
    }
  };

  return (
    <Container className="main-layout py-4">
      <h2 className="section-title text-uppercase mb-4">
        <FaHistory className="me-2 text-danger" /> Purchase history
      </h2>

      {orders.length === 0 ? (
        <Card className="tcg-card text-center py-5 border-0 shadow-sm bg-white">
          <Card.Body>
            <FaReceipt className="text-muted mb-3" size={48} />
            <p className="text-muted fw-bold">You have no orders in the system!</p>
            <Button href="/shop" variant="danger" className="tcg-btn btn-sm px-4">BUY NOW</Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {/*CỘT TRÁI (40%): DANH SÁCH TÓM TẮT CÁC ĐƠN HÀNG */}
          <Col lg={5} md={12} className="mb-4">
            <h5 className="fw-bold mb-3 small text-secondary text-uppercase tracking-wider">
              Order list ({orders.length})
            </h5>
            <div className="order-list-sidebar" style={{ maxHeight: '680px', overflowY: 'auto', paddingRight: '5px' }}>
              {orders.map((o) => (
                <Card
                  key={o.id}
                  onClick={() => handleSelectOrderCard(o.id)} // Gọi hàm select card riêng biệt không bị cảnh báo ESLint
                  className={`mb-3 border-0 shadow-sm custom-order-item-card ${
                    activeTrackOrder?.id === o.id ? 'active-item' : ''
                  }`}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    borderLeft: activeTrackOrder?.id === o.id ? '5px solid #dc3545' : '5px solid transparent',
                    backgroundColor: '#fff'
                  }}
                >
                  <Card.Body className="p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-dark">
                        Order ID: <span className="text-danger">#{String(o.id).toUpperCase()}</span>
                      </span>
                      {getStatusBadge(o.status)}
                    </div>
                    <div className="d-flex justify-content-between text-secondary small mb-1">
                      <span>
                        <FaCalendarAlt className="me-1" size={12}/> 
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '---'}
                      </span>
                      <span className="fw-bold text-danger fs-6">
                        {o.totalPrice ? Number(o.totalPrice).toLocaleString() : 0}đ
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </Col>

          {/* CỘT PHẢI (60%): CHI TIẾT ĐƠN HÀNG ĐANG ĐƯỢC CHỌN */}
          <Col lg={7} md={12}>
            {activeTrackOrder ? (
              <div>
                <h5 className="fw-bold mb-3 small text-secondary text-uppercase tracking-wider">
                  Order details
                </h5>
                
                <Card className="tcg-card border-0 shadow-sm bg-white overflow-hidden rounded-3 mb-4">
                  <Card.Header className="bg-dark text-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <span className="fw-bold text-warning me-2">#{String(activeTrackOrder.id).toUpperCase()}</span>
                      <span className="small text-light border-start ps-2">
                        {activeTrackOrder.createdAt ? new Date(activeTrackOrder.createdAt).toLocaleDateString('vi-VN') : ''}
                      </span>
                    </div>
                    
                    {/* Chỉ hiển thị nút Hủy đơn khi đơn hàng ở các trạng thái chưa xử lý lý/giao */}
                    {(activeTrackOrder.status === 'Pending processing' || activeTrackOrder.status === 'Order placed' || Number(activeTrackOrder.status) === 0 || !activeTrackOrder.status) && (
                      <Button
                        variant="danger"
                        size="sm"
                        className="fw-bold px-3 border-0 py-1"
                        style={{ fontSize: '0.75rem', borderRadius: '4px' }}
                        onClick={() => cancelOrderHandler(activeTrackOrder.id)}
                      >
                        <FaTrashAlt className="me-1" size={10} /> CANCEL ORDER
                      </Button>
                    )}
                  </Card.Header>

                  <Card.Body className="p-4">
                    <div className="mb-4 bg-light p-3 rounded-3 border">
                      <OrderTimeline order={activeTrackOrder} />
                    </div>

                    <h6 className="fw-bold text-dark mb-3 d-flex align-items-center border-bottom pb-2">
                      <FaBoxOpen className="me-2 text-danger" /> Items in the order
                    </h6>
                    
                    {loadingDetail ? (
                      <div className="text-center py-4 text-muted small">Loading product list...</div>
                    ) : (
                      <Table responsive className="align-middle m-0 table-borderless">
                        <thead>
                          <tr className="border-bottom text-secondary small">
                            <th style={{ width: '70px' }}>Image</th>
                            <th>Product Name</th>
                            <th className="text-center">Quantity</th>
                            <th className="text-end">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Đọc chính xác thuộc tính 'orderItems' từ API getOrderById */}
                          {activeTrackOrder.orderItems && activeTrackOrder.orderItems.length > 0 ? (
                            activeTrackOrder.orderItems.map((item, idx) => (
                              <tr key={idx} className="border-bottom">
                                <td className="py-2">
                                  <img
                                    src={item.image} 
                                    alt={item.name}
                                    className="img-thumbnail object-fit-cover shadow-sm bg-white"
                                    style={{ width: '45px', height: '45px', borderRadius: '6px' }}
                                  />
                                </td>
                                <td>
                                  <span className="fw-bold text-dark d-block small line-clamp-1">
                                    {item.name}
                                  </span>
                                </td>
                                <td className="text-center text-secondary small fw-bold">x{item.qty}</td>
                                <td className="text-end fw-bold text-danger small">
                                  {Number(item.price || 0).toLocaleString()}đ
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center py-4 text-muted small">
                                Detailed product data for this order could not be found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    )}

                    <div className="d-flex justify-content-end align-items-center mt-3 pt-3 border-top">
                      <div className="text-end">
                        <span className="text-secondary small me-2"><FaMoneyBillWave className="me-1"/>Total amount to pay:</span>
                        <span className="fw-bold text-danger fs-5">
                          {activeTrackOrder.totalPrice ? Number(activeTrackOrder.totalPrice).toLocaleString() : 0}đ
                        </span>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ) : (
              <div className="h-100 d-flex justify-content-center align-items-center border rounded-3 bg-white shadow-sm p-5 text-muted">
                Please select an order from the list to view its progress details.
              </div>
            )}
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default OrderHistory;