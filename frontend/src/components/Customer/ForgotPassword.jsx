import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import '../../styles/TCGStyles.css';

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
            const { data } = await axiosClient.post('/auth/forgot-password', { email });
            setMessage(data.message || "The system has sent a password reset link to your email!");
        } catch (err) {
            setError(err.response?.data?.message || "The email does not exist in the system or an error occurred!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
            <Card className="tcg-card p-4 shadow" style={{ width: '400px' }}>
                <h3 className="text-center fw-bold text-danger mb-3">FORGOT PASSWORD</h3>
                <p className="text-muted text-center small mb-4">
                    Please enter the email address associated with your account. We will send a password reset link to your inbox.
                </p>

                {error && <Alert variant="danger">{error}</Alert>}
                {message && <Alert variant="success">{message}</Alert>}

                <Form onSubmit={submitHandler}>
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Email Address</Form.Label>
                        <Form.Control 
                            className="tcg-input" 
                            type="email" 
                            placeholder="Enter your email..."
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
                        {loading ? "PROCESSING..." : "SEND REQUEST"}
                    </Button>
                    
                    <div className='py-3 text-center small'>
                        <Link to='/login' style={{ color: '#6c757d', textDecoration: 'none', fontWeight: 'bold' }}>
                             Back to Login
                        </Link>
                    </div>
                </Form>
            </Card>
        </Container>
    );
};

export default ForgotPassword;