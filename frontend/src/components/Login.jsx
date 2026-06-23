import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify'; // 🌟 IMPORT TOAST
import '../styles/TCGStyles.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            
            localStorage.setItem('userInfo', JSON.stringify(data));
            
            // 🌟 HIỂN THỊ CHÀO MỪNG TRỰC QUAN
            toast.success(`Chào mừng ${data.name || 'bạn'} quay trở lại TCG Shop! ✨`);
            
            if (data.isAdmin) {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err) { 
            // 🌟 THÔNG BÁO LỖI ĐĂNG NHẬP
            toast.error(err.response?.data?.message || "Sai tài khoản hoặc mật khẩu rồi!"); 
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
            <Card className="tcg-card p-4 shadow" style={{ width: '400px' }}>
                <h3 className="text-center fw-bold text-danger mb-4">ĐĂNG NHẬP</h3>
                <Form onSubmit={submitHandler}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Email</Form.Label>
                        <Form.Control 
                            className="tcg-input" 
                            type="email" 
                            placeholder="Nhập email của bạn..."
                            onChange={e => setEmail(e.target.value)} 
                            required 
                        />
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Mật khẩu</Form.Label>
                        <Form.Control 
                            className="tcg-input" 
                            type="password" 
                            placeholder="Nhập mật khẩu..."
                            onChange={e => setPassword(e.target.value)} 
                            required 
                        />
                    </Form.Group>
                    
                    <Button className="tcg-btn w-100" variant="danger" type="submit">
                        XÁC NHẬN
                    </Button>
                    
                    <div className='py-3 text-center'>
                        Bạn chưa có tài khoản?{' '}
                        <Link to='/register' style={{ color: '#dc3545', fontWeight: 'bold', textDecoration: 'none' }}>
                            Đăng ký ngay
                        </Link>
                    </div>
                    <div className='text-center'>
                        <Link to='/forgot-password' style={{ color: '#6c757d', textDecoration: 'none', fontWeight: 'bold' }}>
                            Quên mật khẩu?
                        </Link>
                    </div>
                </Form>
            </Card>
        </Container>
    );
};

export default Login;