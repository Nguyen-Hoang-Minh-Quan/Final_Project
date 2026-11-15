import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import '../../styles/TCGStyles.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axiosClient.post('/auth/login', { email, password });
            
            localStorage.setItem('userInfo', JSON.stringify(data));

            // Đồng bộ giỏ hàng riêng của User này (tránh xung đột giỏ hàng của tài khoản khác)
            const savedUserCart = localStorage.getItem(`cartItems_${data.id}`);
            if (savedUserCart) {
                localStorage.setItem('cartItems', savedUserCart);
            } else {
                localStorage.removeItem('cartItems');
            }
            window.dispatchEvent(new Event("cartUpdated"));
            
            toast.success(`Welcome ${data.name || 'bạn'} back to TCG Shop!`);
            
            if (data.isAdmin) {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err) { 
            
            toast.error(err.response?.data?.message || "Invalid username or password!"); 
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
            <Card className="tcg-card p-4 shadow" style={{ width: '400px' }}>
                <h3 className="text-center fw-bold text-danger mb-4">LOGIN</h3>
                <Form onSubmit={submitHandler}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Email</Form.Label>
                        <Form.Control 
                            className="tcg-input" 
                            type="email" 
                            placeholder="Enter your email..."
                            onChange={e => setEmail(e.target.value)} 
                            required 
                        />
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Password</Form.Label>
                        <Form.Control 
                            className="tcg-input" 
                            type="password" 
                            placeholder="Enter your password..."
                            onChange={e => setPassword(e.target.value)} 
                            required 
                        />
                    </Form.Group>
                    
                    <Button className="tcg-btn w-100" variant="danger" type="submit">
                        CONFIRM
                    </Button>
                    
                    <div className='py-3 text-center'>
                        You don't have an account?{' '}
                        <Link to='/register' style={{ color: '#dc3545', fontWeight: 'bold', textDecoration: 'none' }}>
                            Register now
                        </Link>
                    </div>
                    <div className='text-center'>
                        <Link to='/forgot-password' style={{ color: '#6c757d', textDecoration: 'none', fontWeight: 'bold' }}>
                            Forgot your password?
                        </Link>
                    </div>
                </Form>
            </Card>
        </Container>
    );
};

export default Login;