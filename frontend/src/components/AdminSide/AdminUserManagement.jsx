import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Badge, Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaChevronLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import '../../styles/TCGStyles.css';

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/auth/users');
      setUsers(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load the list of accounts!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole, userName) => {
    if (window.confirm(`Are you sure you want to change the role of ${userName} to "${newRole}"?`)) {
      try {
        await axiosClient.put(`/auth/users/${userId}/role`, { role: newRole });
        toast.success(`Successfully updated the role of ${userName} to ${newRole}!`);
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || "Error occurred while updating the role!");
      }
    }
  };

  return (
    <Container className="main-layout py-4">
      <Card className="border-0 shadow-sm p-4">
        <Row className="align-items-center mb-4">
          <Col>
            <h2 className="fw-bold mb-2">
              <FaUserShield className="text-danger me-2" />
              USER MANAGEMENT & ROLE ASSIGNMENT
            </h2>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="border-0 tcg-btn" 
              onClick={() => navigate('/admin')}
            >
              <FaChevronLeft className="me-1" /> BACK TO DASHBOARD
            </Button>
          </Col>
        </Row>

        <Table responsive hover className="admin-table border-top">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>ID</th>
              <th>NAME</th>
              <th>EMAIL</th>
              <th className="text-center">CURRENT ROLE</th>
              <th className="text-end" style={{ width: '220px' }}>CHANGE PERMISSION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-4">Loading user data...</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="fw-bold text-secondary">#{u.id}</td>
                  <td className="fw-bold text-dark">{u.name}</td>
                  <td className="text-muted">{u.email}</td>
                  <td className="text-center">
                    <Badge bg={u.role === 'Admin' ? 'danger' : u.role === 'Staff' ? 'warning' : 'secondary'} className={u.role === 'Staff' ? 'text-dark' : ''}>
                      {u.role || (u.isAdmin ? 'Admin' : 'Customer')}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Form.Select
                      size="sm"
                      value={u.role || (u.isAdmin ? 'Admin' : 'Customer')}
                      onChange={(e) => handleRoleChange(u.id, e.target.value, u.name)}
                      className="tcg-input d-inline-block w-auto fw-bold"
                    >
                      <option value="Customer">Customer</option>
                      <option value="Staff">Staff</option>
                      <option value="Admin">Admin</option>
                    </Form.Select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </Container>
  );
};

export default AdminUserManagement;