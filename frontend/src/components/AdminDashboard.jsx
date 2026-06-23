import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBoxOpen, FaTools, FaChartLine, FaComment } from 'react-icons/fa';
import '../styles/TCGStyles.css';

const AdminDashboard = () => {
    const adminActions = [
        { title: "QUẢN LÝ ĐƠN HÀNG", icon: <FaBoxOpen />, color: "bg-primary", link: "/admin/orders" },
        { title: "QUẢN LÝ SẢN PHẨM", icon: <FaTools />, color: "bg-danger", link: "/admin/products" },
        { title: "THỐNG KÊ DOANH THU", icon: <FaChartLine />, color: "bg-success", link: "/admin/stats" },
        { title: "QUẢN LÝ ĐÁNH GIÁ", icon: <FaComment />, color: "bg-info", link: "/admin/reviews" }
    ];

    return (
        <Container className="main-layout">
            <h2 className="section-title mb-5">HỆ THỐNG QUẢN TRỊ</h2>
            <Row className="g-4">
                {adminActions.map((action, idx) => (
                    <Col md={4} key={idx}>
                        <Card className="tcg-card admin-stat-card">
                            <div className={`${action.color} bg-opacity-10 icon-circle`}>
                                <span className={`fs-1 text-${action.color.replace('bg-','')}`}>{action.icon}</span>
                            </div>
                            <Card.Title className="fw-bold mb-3">{action.title}</Card.Title>
                            <Button as={Link} to={action.link} variant={action.color.replace('bg-','')} className="tcg-btn w-100">TRUY CẬP</Button>
                        </Card>
                    </Col>
                    
                ))}
            </Row>
        </Container>
    );
};
export default AdminDashboard;