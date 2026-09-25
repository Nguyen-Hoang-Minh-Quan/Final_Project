import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBoxOpen, FaTools, FaComment, FaNewspaper, FaComments, FaExclamationTriangle, FaHourglassHalf } from 'react-icons/fa';
import axiosClient from '../../api/axiosClient';
import '../../styles/TCGStyles.css';

const StaffDashboard = () => {
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          axiosClient.get('/orders'),
          axiosClient.get('/products')
        ]);
        
        // Đếm đơn hàng đang chờ xử lý từ DB
        const pending = ordersRes.data.filter(o => 
          o.status === 'Chờ xử lý' || 
          o.status === 'Processing' || 
          o.status === 'Pending' || 
          !o.isDelivered
        ).length;
        setPendingOrdersCount(pending);

        // Đếm sản phẩm có kho <= 5
        const lowStock = productsRes.data.filter(p => Number(p.countInStock) <= 5).length;
        setLowStockCount(lowStock);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu dashboard:", err);
      }
    };
    fetchQuickStats();
  }, []);

  const staffActions = [
    { title: "XỬ LÝ ĐƠN HÀNG", icon: <FaBoxOpen />, color: "bg-primary", link: "/admin/orders", badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} đơn mới` : null },
    { title: "QUẢN LÝ KHO HÀNG", icon: <FaTools />, color: "bg-danger", link: "/admin/products", badge: lowStockCount > 0 ? `${lowStockCount} mặt hàng sắp hết` : null },
    { title: "ĐĂNG TIN TỨC TCG", icon: <FaNewspaper />, color: "bg-secondary", link: "/admin/blogs" },
    { title: "QUẢN LÝ ĐÁNH GIÁ", icon: <FaComment />, color: "bg-info", link: "/admin/reviews" },
    { title: "PHÒNG CHAT HỖ TRỢ", icon: <FaComments />, color: "bg-warning", link: "/admin/chat" }
  ];

  return (
    <Container className="main-layout py-4">
      {/* HEADER BẢNG ĐIỀU KHIỂN */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="section-title text-uppercase m-0 fw-bold">
          BẢNG ĐIỀU KHIỂN NHÂN VIÊN
        </h2>
        <Badge bg="warning" text="dark" className="text-uppercase px-3 py-2 fw-bold fs-6">
          ROLE: STAFF
        </Badge>
      </div>

      {/* KHỐI CẢNH BÁO TÁC VỤ */}
      <Row className="mb-4 g-3">
        <Col md={6}>
          <Card className="border-0 shadow-sm bg-warning bg-opacity-10 border-start border-warning border-4">
            <Card.Body className="d-flex align-items-center">
              <FaHourglassHalf className="fs-1 text-warning me-3" />
              <div>
                <h6 className="fw-bold mb-1">Đơn hàng cần duyệt</h6>
                <div className="fs-5 fw-bold text-dark">{pendingOrdersCount} đơn đang chờ xử lý</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 shadow-sm bg-danger bg-opacity-10 border-start border-danger border-4">
            <Card.Body className="d-flex align-items-center">
              <FaExclamationTriangle className="fs-1 text-danger me-3" />
              <div>
                <h6 className="fw-bold mb-1">Cảnh báo kho hàng</h6>
                <div className="fs-5 fw-bold text-dark">{lowStockCount} sản phẩm có nguy cơ hết hàng</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* THẺ THAO TÁC */}
      <Row className="g-4">
        {staffActions.map((action, idx) => (
          <Col md={4} sm={6} key={idx}>
            <Card className="tcg-card border-0 shadow-sm h-100 position-relative">
              {action.badge && (
                <Badge bg="danger" className="position-absolute top-0 end-0 m-3 px-2 py-1">
                  {action.badge}
                </Badge>
              )}
              <Card.Body className="d-flex flex-column align-items-center text-center p-4">
                <div className={`${action.color} bg-opacity-10 mb-3 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '70px', height: '70px' }}>
                  <span className={`fs-2 text-${action.color.replace('bg-', '')}`}>{action.icon}</span>
                </div>
                <Card.Title className="fw-bold fs-6 mb-3 text-dark text-uppercase">{action.title}</Card.Title>
                <Button as={Link} to={action.link} variant={action.color.replace('bg-', '')} className="tcg-btn w-100 mt-auto fw-bold">
                  THỰC HIỆN
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default StaffDashboard;