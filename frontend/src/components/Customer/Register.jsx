import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import '../../styles/TCGStyles.css';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/auth/register', formData);
      
      //THÔNG BÁO TOAST THÀNH CÔNG VÀ CHUYỂN TRANG
      toast.success("Account registered successfully! Please log in now."); 
      navigate('/login');
    } catch (err) { 
      //THÔNG BÁO TOAST THẤT BẠI
      toast.error(err.response?.data?.message || "Error registering account!"); 
    }
  };

  return (
    <Container className="main-layout d-flex justify-content-center">
      <Card className="tcg-card p-4 shadow" style={{width: '400px'}}>
        <h3 className="text-center fw-bold text-danger mb-4">Register</h3>
        <Form onSubmit={handleRegister}>
          <Form.Group className="mb-3">
            <Form.Label>Display Name</Form.Label>
            <Form.Control className="tcg-input" onChange={e => setFormData({...formData, name: e.target.value})} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control className="tcg-input" type="email" onChange={e => setFormData({...formData, email: e.target.value})} required />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Password</Form.Label>
            <Form.Control className="tcg-input" type="password" onChange={e => setFormData({...formData, password: e.target.value})} required />
          </Form.Group>
          <Button className="tcg-btn w-100" variant="danger" type="submit">Register Now</Button>
        </Form>
      </Card>
    </Container>
  );
};

export default Register;