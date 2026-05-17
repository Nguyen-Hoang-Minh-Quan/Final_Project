import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// Sửa lỗi: Gộp các import icon vào một dòng và thêm icon thiếu
import { FaChevronLeft, FaMoneyBillWave, FaCheckCircle } from 'react-icons/fa';
// Sửa lỗi: Xóa bỏ import trùng lặp và các biến không sử dụng (LineChart, Line)
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import '../styles/TCGStyles.css';

const AdminStats = () => {
  const [stats, setStats] = useState({ totalRevenue: 0, orderCount: 0, dailySales: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

        const { data } = await axios.get('http://localhost:5000/api/orders/stats', config);
        setStats(data);
      } catch (err) {
        console.error("Lỗi fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="danger" />
        <p className="mt-2">Đang tải dữ liệu doanh thu...</p>
      </Container>
    );
  }

  return (
    <Container className="main-layout">
      <div className="d-flex align-items-center mb-4">
        <Button variant="outline-secondary" className="border-0 me-3 tcg-btn" onClick={() => navigate('/admin')}>
          <FaChevronLeft /> QUAY LẠI
        </Button>
        <h2 className="fw-bold mb-0">THỐNG KÊ DOANH THU</h2>
      </div>

      <Row>
        <Col md={6} className="mb-4">
          <Card className="tcg-card p-4 border-0 shadow-sm bg-danger text-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-uppercase opacity-75">Tổng Doanh Thu</h6>
                <h2 className="fw-bold mb-0">
                  {stats.totalRevenue ? stats.totalRevenue.toLocaleString() : 0} VNĐ
                </h2>
              </div>
              <FaMoneyBillWave size={40} className="opacity-50" />
            </div>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card className="tcg-card p-4 border-0 shadow-sm bg-success text-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-uppercase opacity-75">Đơn Hàng Thành Công</h6>
                <h2 className="fw-bold mb-0">{stats.orderCount || 0} Đơn</h2>
              </div>
              <FaCheckCircle size={40} className="opacity-50" />
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="tcg-card p-4 mt-2 border-0 shadow-sm">
        <h4 className="fw-bold mb-4 text-center">BIỂU ĐỒ TĂNG TRƯỞNG DOANH THU</h4>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={stats.dailySales || []}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc3545" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#dc3545" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip formatter={(value) => [`${value.toLocaleString()}đ`, "Doanh thu"]} />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="#dc3545" 
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="d-flex justify-content-center mt-4">
          <div className="p-3 border rounded bg-light text-center" style={{ minWidth: '200px' }}>
            <small className="text-muted d-block text-uppercase">Giá trị trung bình/đơn</small>
            <span className="fw-bold fs-4 text-danger">
              {stats.orderCount > 0 
                ? Math.round(stats.totalRevenue / stats.orderCount).toLocaleString() 
                : 0}đ
            </span>
          </div>
        </div>
      </Card>
    </Container>
  );
};

export default AdminStats;