import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Form, Card, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient'; 
import { HiOutlineChevronLeft, HiOutlineClipboardDocumentList, HiOutlineBanknotes } from 'react-icons/hi2';
import '../../styles/TCGStyles.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  // Lưu danh sách ID đơn hàng đang bấm mở rộng khi có nhiều hơn 2 sản phẩm
  const [expandedOrderIds, setExpandedOrderIds] = useState({});
  const navigate = useNavigate();

  const toggleExpandItems = (orderId) => {
    setExpandedOrderIds((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // --- HÀM LẤY DANH SÁCH ĐƠN HÀNG CÓ KÈM TOKEN ---
  const getOrders = async () => {
    try {
      const { data } = await axiosClient.get('/orders/all');
      
      console.log("ORDER DATA RECEIVED BY ADMIN:", data);
      
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
      console.error("Error loading orders:", err);
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
      console.error("Error updating status:", err);
      alert("Error updating order status!");
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
                <HiOutlineChevronLeft className="me-1"/> GO BACK
              </Button>
              <div>
                <h2 className="fw-bold mb-0">
                  <HiOutlineClipboardDocumentList className="text-danger me-2"/>ORDER MANAGEMENT
                </h2>
                <small className="text-muted">Track and update shipping status</small>
              </div>
            </div>
          </Col>
        </Row>

        <Table responsive hover className="admin-table border-top">
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>CUSTOMER</th>
              <th style={{ minWidth: '280px' }}>PRODUCTS</th>
              <th className="text-center">TOTAL</th>
              <th className="text-center"><HiOutlineBanknotes className="me-1"/>PAYMENT METHOD</th>
              <th className="text-center">STATUS</th>
              <th className="text-end" style={{ width: '185px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => {
              const orderId = o.id || o._id;
              const items = Array.isArray(o.orderItems) ? o.orderItems : [];
              const isExpanded = Boolean(expandedOrderIds[orderId]);
              const visibleItems = isExpanded ? items : items.slice(0, 2);
              const hiddenCount = items.length - visibleItems.length;

              return (
                <tr key={orderId}>
                  <td className="fw-bold">#{String(orderId).slice(-6).toUpperCase()}</td>
                  <td>
                    {/* Hiển thị tên tài khoản khách hàng từ dữ liệu User được join ở Backend */}
                    <div className="fw-bold text-dark">
                      {o.UserData?.name || o.User?.name || o.user?.name || o.userName || "Customer"}
                    </div>
                    <small className="text-muted">{o.phone}</small>
                  </td>
                  <td>
                    {/* Hiển thị ảnh và tên các sản phẩm khách hàng đã đặt */}
                    {items.length === 0 ? (
                      <span className="text-muted small fst-italic">No product details</span>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {visibleItems.map((item, idx) => (
                          <div key={item.id || idx} className="d-flex align-items-center gap-2">
                            <img
                              src={item.image || 'https://via.placeholder.com/42'}
                              alt={item.name}
                              className="rounded border bg-white flex-shrink-0"
                              style={{ width: '42px', height: '42px', objectFit: 'contain', padding: '2px' }}
                            />
                            <div className="min-w-0">
                              <div
                                className="fw-semibold text-dark small text-truncate"
                                style={{ maxWidth: '240px' }}
                                title={item.name}
                              >
                                {item.name}
                              </div>
                              <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.75rem' }}>
                                <Badge bg="light" text="dark" className="border">
                                  x{item.qty}
                                </Badge>
                                <span className="text-muted">
                                  {Number(item.price || 0).toLocaleString()}đ
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {hiddenCount > 0 && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-start text-danger fw-bold text-decoration-none"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => toggleExpandItems(orderId)}
                          >
                            + {hiddenCount} more item{hiddenCount > 1 ? 's' : ''}
                          </button>
                        )}
                        {isExpanded && items.length > 2 && (
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-start text-secondary fw-bold text-decoration-none"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => toggleExpandItems(orderId)}
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    )}
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
                      bg={
                        o.status === 'Delivered' ? 'success' : 
                        o.status === 'In Transit' ? 'warning' : 
                        o.status === 'Pending' ? 'info' : 'danger'
                      }
                      className="px-3 py-2"
                    >
                      {o.status || 'Pending'}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Form.Select 
                      size="sm" 
                      className="tcg-input" 
                      value={o.status || ''}
                      onChange={(e) => updateStatus(orderId, e.target.value)}
                    >
                      <option value="" disabled>Update status...</option>
                      <option value="Pending">Pending</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </Form.Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        
        {orders.length === 0 && (
          <div className="text-center py-5 text-muted">
            No orders found in the system.
          </div>
        )}
      </Card>
    </Container>
  );
};

export default AdminOrders;