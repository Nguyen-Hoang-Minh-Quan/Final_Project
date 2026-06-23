import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/TCGStyles.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submitHandler = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            // Gọi API gửi yêu cầu khôi phục đến Backend
            const { data } = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            setMessage(data.message || "Hệ thống đã gửi liên kết đặt lại mật khẩu vào Email của bạn!");
        } catch (err) {
            setError(err.response?.data?.message || "Email không tồn tại trong hệ thống hoặc có lỗi xảy ra!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
            <Card className="tcg-card p-4 shadow" style={{ width: '400px' }}>
                <h3 className="text-center fw-bold text-danger mb-3">QUÊN MẬT KHẨU</h3>
                <p className="text-muted text-center small mb-4">
                    Vui lòng nhập Email đã đăng ký tài khoản. Chúng tôi sẽ gửi liên kết khôi phục mật khẩu đến hòm thư của bạn.
                </p>

                {error && <Alert variant="danger">{error}</Alert>}
                {message && <Alert variant="success">{message}</Alert>}

                <Form onSubmit={submitHandler}>
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Địa chỉ Email</Form.Label>
                        <Form.Control 
                            className="tcg-input" 
                            type="email" 
                            placeholder="Nhập email của bạn..."
                            value={email}
                            onChange={e => setEmail(e.target.value)} 
                            required 
                            disabled={loading}
                        />
                    </Form.Group>
                    
                    <Button 
                        className="tcg-btn w-100" 
                        variant="danger" 
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "ĐANG XỬ LÝ..." : "GỬI YÊU CẦU"}
                    </Button>
                    
                    <div className='py-3 text-center small'>
                        <Link to='/login' style={{ color: '#6c757d', textDecoration: 'none', fontWeight: 'bold' }}>
                             Quay lại đăng nhập
                        </Link>
                    </div>
                </Form>
            </Card>
        </Container>
    );
};

export default ForgotPassword;