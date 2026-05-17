import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/TCGStyles.css';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      alert("Đăng ký thành công!"); navigate('/login');
    } catch (err) { alert("Lỗi đăng ký!"); }
  };

  return (
    <Container className="main-layout d-flex justify-content-center">
      <Card className="tcg-card p-4 shadow" style={{width: '400px'}}>
        <h3 className="text-center fw-bold text-danger mb-4">ĐĂNG KÝ</h3>
        <Form onSubmit={handleRegister}>
          <Form.Group className="mb-3"><Form.Label>Tên hiển thị</Form.Label>
            <Form.Control className="tcg-input" onChange={e => setFormData({...formData, name: e.target.value})} required />
          </Form.Group>
          <Form.Group className="mb-3"><Form.Label>Email</Form.Label>
            <Form.Control className="tcg-input" type="email" onChange={e => setFormData({...formData, email: e.target.value})} required />
          </Form.Group>
          <Form.Group className="mb-4"><Form.Label>Mật khẩu</Form.Label>
            <Form.Control className="tcg-input" type="password" onChange={e => setFormData({...formData, password: e.target.value})} required />
          </Form.Group>
          <Button className="tcg-btn w-100" variant="danger" type="submit">ĐĂNG KÝ NGAY</Button>
        </Form>
      </Card>
    </Container>
  );
};
export default Register;