import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Tab, Tabs, Badge, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { HiOutlineClipboardDocumentList, HiOutlineArchiveBox, HiOutlineShieldCheck, HiOutlineChevronLeft } from 'react-icons/hi2';
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
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Helper hiển thị tên tài khoản thực hiện kèm nhãn ghi chú nếu không còn là Staff (hoặc đã bị xóa)
  const renderStaffIdentity = (log) => {
    const account = log.StaffData;

    // Trường hợp tài khoản đã bị xóa khỏi hệ thống
    if (!account) {
      return (
        <div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="fw-bold text-secondary">Account #{log.staffId}</span>
            <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>
              Former Staff (Deleted)
            </Badge>
          </div>
          <small className="text-muted">Account no longer exists</small>
        </div>
      );
    }

    const isAdmin = Boolean(account.isAdmin) || account.role === 'Admin';
    const isCurrentStaff = !isAdmin && account.role === 'Staff';
    const isFormerStaff = !isAdmin && !isCurrentStaff;

    return (
      <div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="fw-bold text-dark">{account.name}</span>
          {isCurrentStaff && (
            <Badge bg="primary" style={{ fontSize: '0.68rem' }}>
              Staff
            </Badge>
          )}
          {isAdmin && (
            <Badge bg="danger" style={{ fontSize: '0.68rem' }}>
              Admin
            </Badge>
          )}
          {isFormerStaff && (
            <Badge bg="warning" text="dark" style={{ fontSize: '0.68rem' }}>
              Former Staff (Now {account.role || 'Customer'})
            </Badge>
          )}
        </div>
        {account.email && <small className="text-muted">{account.email}</small>}
      </div>
    );
  };

  return (
    <Container className="main-layout py-4">
      <Card className="border-0 shadow-sm p-4">
        <Row className="align-items-center mb-4">
          <Col>
            <h2 className="fw-bold mb-2">
              <HiOutlineClipboardDocumentList className="text-danger me-2" />
              SYSTEM & INVENTORY LOGS
            </h2>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="border-0 tcg-btn" 
              onClick={() => navigate('/admin')}
            >
              <HiOutlineChevronLeft className="me-1" /> GO BACK
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
                <HiOutlineArchiveBox className="me-2" />
                Inventory Change Logs ({inventoryLogs.length})
              </span>
            }
          >
            <Table responsive hover className="admin-table border-top mt-3">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>PERFORMED BY</th>
                  <th className="text-center">CHANGE TYPE</th>
                  <th className="text-center">OLD STOCK → NEW STOCK</th>
                  <th className="text-center">CHANGE QUANTITY</th>
                  <th>REASON / NOTES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">Loading data...</td>
                  </tr>
                ) : inventoryLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">No inventory change logs available.</td>
                  </tr>
                ) : (
                  inventoryLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="fw-bold text-dark">{log.ProductData?.name || `Product #${log.productId}`}</div>
                      </td>
                      <td>
                        {renderStaffIdentity(log)}
                      </td>
                      <td className="text-center">
                        <Badge bg={log.changeType === 'IMPORT' ? 'success' : 'warning'}>
                          {log.changeType}
                        </Badge>
                      </td>
                      <td className="text-center fw-bold">
                        {log.oldStock} → <span className="text-primary">{log.newStock}</span>
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
                <HiOutlineShieldCheck className="me-2" />
                Staff Activity Log ({staffLogs.length})
              </span>
            }
          >
            <Table responsive hover className="admin-table border-top mt-3">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>STAFF</th>
                  <th>ACTION</th>
                  <th>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4">Loading data...</td>
                  </tr>
                ) : staffLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">No staff activity logs available.</td>
                  </tr>
                ) : (
                  staffLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="fw-bold text-secondary">#{log.id}</td>
                      <td>
                        {renderStaffIdentity(log)}
                      </td>
                      <td>
                        <Badge bg="info" className="text-dark">{log.action}</Badge>
                      </td>
                      <td className="text-muted small">{log.details || 'No details available'}</td>
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