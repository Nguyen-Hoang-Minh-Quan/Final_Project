import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBoxOpen, FaTools, FaChartLine, FaComment, FaClipboardList, FaNewspaper, FaComments, FaUserShield } from 'react-icons/fa';
import '../../styles/TCGStyles.css';

const AdminDashboard = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const userRole = userInfo.role || (userInfo.isAdmin ? 'Admin' : 'Customer');

  const allActions = [
    { title: "ORDER MANAGEMENT", icon: <FaBoxOpen />, color: "bg-primary", link: "/admin/orders", roles: ['Admin', 'Staff'] },
    { title: "PRODUCT MANAGEMENT", icon: <FaTools />, color: "bg-danger", link: "/admin/products", roles: ['Admin', 'Staff'] },
    { title: "REVIEW MANAGEMENT", icon: <FaComment />, color: "bg-info", link: "/admin/reviews", roles: ['Admin', 'Staff'] },
    { title: "SUPPORT CHAT", icon: <FaComments />, color: "bg-warning", link: "/admin/chat", roles: ['Admin', 'Staff'] },
    { title: "BLOG MANAGEMENT", icon: <FaNewspaper />, color: "bg-secondary", link: "/admin/blogs", roles: ['Admin', 'Staff'] },
    { title: "USER MANAGEMENT", icon: <FaUserShield />, color: "bg-danger", link: "/admin/users", roles: ['Admin'] },
    { title: "REVENUE STATISTICS", icon: <FaChartLine />, color: "bg-success", link: "/admin/stats", roles: ['Admin'] },
    { title: "STAFF ACTIVITY LOG", icon: <FaClipboardList />, color: "bg-dark", link: "/admin/staff-logs", roles: ['Admin'] }
  ];

  const allowedActions = allActions.filter(action => action.roles.includes(userRole));

  return (
    <Container className="main-layout py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="section-title text-uppercase m-0">
          {userRole === 'Admin' ? 'ADMIN CONTROL PANEL' : 'STAFF DASHBOARD'}
        </h2>
        <span className="badge bg-danger text-uppercase px-3 py-2 fw-bold">
          Permissions: {userRole}
        </span>
      </div>

      <Row className="g-4">
        {allowedActions.map((action, idx) => (
          <Col md={4} sm={6} key={idx}>
            <Card className="tcg-card admin-stat-card border-0 shadow-sm h-100">
              <Card.Body className="d-flex flex-column align-items-center text-center p-4">
                <div className={`${action.color} bg-opacity-10 icon-circle mb-3 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: '70px', height: '70px' }}>
                  <span className={`fs-2 text-${action.color.replace('bg-', '')}`}>{action.icon}</span>
                </div>
                <Card.Title className="fw-bold fs-6 mb-3 text-dark text-uppercase">{action.title}</Card.Title>
                <Button as={Link} to={action.link} variant={action.color.replace('bg-', '')} className="tcg-btn w-100 mt-auto fw-bold">
                  ACCESS
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default AdminDashboard;