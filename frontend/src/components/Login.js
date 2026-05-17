import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
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
            data.role === 'admin' ? navigate('/admin') : navigate('/');
            window.location.reload();
        } catch (err) { alert("Sai tài khoản rồi!"); }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{minHeight:'70vh'}}>
            <Card className="tcg-card p-4 shadow" style={{width:'400px'}}>
                <h3 className="text-center fw-bold text-danger mb-4">ĐĂNG NHẬP</h3>
                <Form onSubmit={submitHandler}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Email</Form.Label>
                        <Form.Control className="tcg-input" type="email" onChange={e => setEmail(e.target.value)} required />
                    </Form.Group>
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Mật khẩu</Form.Label>
                        <Form.Control className="tcg-input" type="password" onChange={e => setPassword(e.target.value)} required />
                    </Form.Group>
                    <Button className="tcg-btn w-100" variant="danger" type="submit">XÁC NHẬN</Button>
                    <div className='py-3 text-center'>
                      Bạn chưa có tài khoản?{' '}
                      <Link to='/register' style={{ color: '#dc3545', fontWeight: 'bold', textDecoration: 'none' }}>
                        Đăng ký ngay
                      </Link>
                    </div>
                </Form>
            </Card>
        </Container>
    );
};
export default Login;