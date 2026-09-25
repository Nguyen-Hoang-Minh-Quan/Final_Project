import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Tab, Tabs, Badge, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaClipboardList, FaBoxes, FaUserShield, FaChevronLeft } from 'react-icons/fa';
import axiosClient from '../../api/axiosClient';
import '../../styles/TCGStyles.css';

const AdminStaffLogs = () => {
  const navigate = useNavigate();
  const [key, setKey] = useState('inventory');
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [staffLogs, setStaffLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const [invRes, staffRes] = await Promise.all([
        axiosClient.get('/logs/inventory'),
        axiosClient.get('/logs/staff')
      ]);
      setInventoryLogs(invRes.data);
      setStaffLogs(staffRes.data);
    } catch (error) {
      console.error("Lỗi tải nhật ký:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <Container className="main-layout py-4">
      <Card className="border-0 shadow-sm p-4">
        <Row className="align-items-center mb-4">
          <Col>
            <h2 className="fw-bold mb-2">
              <FaClipboardList className="text-danger me-2" />
              NHẬT KÝ HỆ THỐNG & KHO HÀNG
            </h2>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="border-0 tcg-btn" 
              onClick={() => navigate('/admin')}
            >
              <FaChevronLeft className="me-1" /> QUAY LẠI
            </Button>
          </Col>
        </Row>

        <Tabs
          id="logs-tab"
          activeKey={key}
          onSelect={(k) => setKey(k)}
          className="mb-4 custom-tabs"
        >
          <Tab 
            eventKey="inventory" 
            title={
              <span>
                <FaBoxes className="me-2" />
                Lịch Sử Biến Động Kho ({inventoryLogs.length})
              </span>
            }
          >
            <Table responsive hover className="admin-table border-top mt-3">
              <thead>
                <tr>
                  <th>SẢN PHẨM</th>
                  <th>NGƯỜI THỰC HIỆN</th>
                  <th className="text-center">LOẠI BIẾN ĐỘNG</th>
                  <th className="text-center">KHO CŨ $\rightarrow$ KHO MỚI</th>
                  <th className="text-center">THAY ĐỔI</th>
                  <th>LÝ DO / GHI CHÚ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">Đang tải dữ liệu...</td>
                  </tr>
                ) : inventoryLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">Chưa có ghi nhận biến động kho nào.</td>
                  </tr>
                ) : (
                  inventoryLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="fw-bold text-dark">{log.ProductData?.name || `Sản phẩm #${log.productId}`}</div>
                      </td>
                      <td>
                        <div className="fw-bold">{log.StaffData?.name || `Staff #${log.staffId}`}</div>
                        <small className="text-muted">{log.StaffData?.email}</small>
                      </td>
                      <td className="text-center">
                        <Badge bg={log.changeType === 'IMPORT' ? 'success' : 'warning'}>
                          {log.changeType}
                        </Badge>
                      </td>
                      <td className="text-center fw-bold">
                        {log.oldStock} $\rightarrow$ <span className="text-primary">{log.newStock}</span>
                      </td>
                      <td className="text-center">
                        <span className={`fw-bold ${log.changeQuantity > 0 ? 'text-success' : 'text-danger'}`}>
                          {log.changeQuantity > 0 ? `+${log.changeQuantity}` : log.changeQuantity}
                        </span>
                      </td>
                      <td className="text-muted small">{log.reason || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Tab>

          <Tab 
            eventKey="staff" 
            title={
              <span>
                <FaUserShield className="me-2" />
                Nhật Ký Hoạt Động Staff ({staffLogs.length})
              </span>
            }
          >
            <Table responsive hover className="admin-table border-top mt-3">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>NHÂN VIÊN</th>
                  <th>HÀNH ĐỘNG</th>
                  <th>CHI TIẾT THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4">Đang tải dữ liệu...</td>
                  </tr>
                ) : staffLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">Chưa có nhật ký hoạt động nào.</td>
                  </tr>
                ) : (
                  staffLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="fw-bold text-secondary">#{log.id}</td>
                      <td>
                        <div className="fw-bold text-dark">{log.StaffData?.name || `Staff #${log.staffId}`}</div>
                        <small className="text-muted">{log.StaffData?.email}</small>
                      </td>
                      <td>
                        <Badge bg="info" className="text-dark">{log.action}</Badge>
                      </td>
                      <td className="text-muted small">{log.details || 'Không có chi tiết'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Tab>
        </Tabs>
      </Card>
    </Container>
  );
};

export default AdminStaffLogs;