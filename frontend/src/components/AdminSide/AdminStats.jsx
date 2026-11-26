import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient'; 
import { HiOutlineChevronLeft, HiOutlineBanknotes, HiOutlineCheckCircle, HiOutlineFire } from 'react-icons/hi2';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import '../../styles/TCGStyles.css';

const AdminStats = () => {
  const [stats, setStats] = useState({ totalRevenue: 0, orderCount: 0, dailySales: [] });
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Giải pháp an toàn: Gọi riêng biệt để nếu API Top Products lỗi, biểu đồ doanh thu vẫn chạy ngon lành
        try {
          const statsRes = await axiosClient.get('/orders/stats');
          // Kiểm tra xem axiosClient của bạn trả về thẳng data hay trả về response gốc
          const statsData = statsRes.data ? statsRes.data : statsRes;
          if (statsData) setStats(statsData);
        } catch (statsErr) {
          console.error("Error loading revenue statistics data:", statsErr);
        }

        try {
          const topProductsRes = await axiosClient.get('/orders/top-products');
          const topProductsData = topProductsRes.data ? topProductsRes.data : topProductsRes;
          if (Array.isArray(topProductsData)) {
            setTopProducts(topProductsData);
          }
        } catch (prodErr) {
          console.error("Error or missing API /orders/top-products:", prodErr);
          // Giữ mảng rỗng để giao diện không bị crash
          setTopProducts([]); 
        }

      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="danger" />
        <p className="mt-2">Loading revenue data...</p>
      </Container>
    );
  }

  return (
    <Container className="main-layout">
      <div className="d-flex align-items-center mb-4">
        <Button variant="outline-secondary" className="border-0 me-3 tcg-btn" onClick={() => navigate('/admin')}>
          <HiOutlineChevronLeft /> GO BACK
        </Button>
        <h2 className="fw-bold mb-0">REVENUE STATISTICS</h2>
      </div>

      <Row>
        <Col md={6} className="mb-4">
          <Card className="tcg-card p-4 border-0 shadow-sm bg-danger text-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-uppercase opacity-75">Total Revenue</h6>
                <h2 className="fw-bold mb-0">
                  {stats.totalRevenue ? Number(stats.totalRevenue).toLocaleString() : 0} VNĐ
                </h2>
              </div>
              <HiOutlineBanknotes size={40} className="opacity-50" />
            </div>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card className="tcg-card p-4 border-0 shadow-sm bg-success text-white">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="text-uppercase opacity-75">Successful Orders</h6>
                <h2 className="fw-bold mb-0">{stats.orderCount || 0} Orders</h2>
              </div>
              <HiOutlineCheckCircle size={40} className="opacity-50" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* BIỂU ĐỒ DOANH THU */}
      <Card className="tcg-card p-4 mt-2 border-0 shadow-sm">
        <h4 className="fw-bold mb-4 text-center">REVENUE GROWTH CHART</h4>
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
              <YAxis 
                width={100} 
                dx={-5}
                tickFormatter={(value) => `${Number(value || 0).toLocaleString()}đ`} 
              />
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}đ`, "Revenue"]} />
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
            <small className="text-muted d-block text-uppercase">Average Order Value</small>
            <span className="fw-bold fs-4 text-danger">
              {stats.orderCount > 0 
                ? Math.round(stats.totalRevenue / stats.orderCount).toLocaleString() 
                : 0}đ
            </span>
          </div>
        </div>
      </Card>

      {/* BẢNG TOP 5 SẢN PHẨM BÁN CHẠY NHẤT */}
      <Card className="tcg-card p-4 mt-4 border-0 shadow-sm mb-5">
        <div className="d-flex align-items-center justify-content-center mb-4">
          <HiOutlineFire className="text-warning me-2" size={24} />
          <h4 className="fw-bold mb-0 text-uppercase text-dark">Top 5 Products Most Sold</h4>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th scope="col" className="text-center" style={{ width: '70px' }}>Rank</th>
                <th scope="col" className="text-center" style={{ width: '90px' }}>Image</th>
                <th scope="col">Product Name</th>
                <th scope="col" className="text-end" style={{ width: '150px' }}>Unit Price</th>
                <th scope="col" className="text-center" style={{ width: '130px' }}>Quantity Sold</th>
                <th scope="col" className="text-end" style={{ width: '160px' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts && topProducts.length > 0 ? (
                topProducts.map((product, index) => {
                  const soldQty = Number(product.totalSold || product.total_sold || 0);
                  const unitPrice = Number(product.price || 0);
                  const revenue = Number(product.totalRevenue || soldQty * unitPrice);
                  const rankBadgeBg =
                    index === 0 ? 'bg-warning text-dark' :
                    index === 1 ? 'bg-secondary text-white' :
                    index === 2 ? 'bg-danger text-white' : 'bg-light text-dark border';

                  return (
                    <tr key={product.productId || index}>
                      <td className="text-center">
                        <span className={`badge ${rankBadgeBg} px-2 py-1 fw-bold`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="text-center">
                        <img 
                          src={product.image || 'https://via.placeholder.com/55x75'} 
                          alt={product.name} 
                          className="rounded border shadow-sm bg-white p-1" 
                          style={{ width: '55px', height: '72px', objectFit: 'contain' }} 
                        />
                      </td>
                      <td>
                        <span className="fw-bold text-dark d-block">{product.name}</span>
                        <small className="text-muted">Product ID: #{product.productId}</small>
                      </td>
                      <td className="text-end text-secondary fw-semibold">
                        {unitPrice.toLocaleString()}đ
                      </td>
                      <td className="text-center">
                        <span className="badge bg-success px-3 py-2 fs-6 rounded-pill">
                          {soldQty}
                        </span>
                      </td>
                      <td className="text-end text-danger fw-bold fs-6">
                        {revenue.toLocaleString()}đ
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No sales data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Container>
  );
};

export default AdminStats;