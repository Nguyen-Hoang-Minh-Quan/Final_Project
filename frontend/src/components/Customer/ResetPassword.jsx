import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../../styles/TCGStyles.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { token } = useParams(); 
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();

        //BÁO LỖI SO KHỚP QUA TOAST NGAY LẬP TỨC
        if (password !== confirmPassword) {
            return toast.error('Passwords do not match!');
        }

        setLoading(true);
        try {
            const { data } = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, { password });
            
            //THÔNG BÁO ĐỔI MẬT KHẨU THÀNH CÔNG
            toast.success(data.message || 'Password reset successfully!');
            
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            //THÔNG BÁO KHI TOKEN HẾT HẠN HOẶC SAI LỖI
            toast.error(err.response?.data?.message || 'Link has expired or is invalid!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
            <Card className="tcg-card p-4 shadow" style={{ width: '400px' }}>
                <h3 className="text-center fw-bold text-danger mb-4">NEW PASSWORD</h3>

                <Form onSubmit={submitHandler}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">New Password</Form.Label>
                        <Form.Control 
                            className="tcg-input" 
                            type="password" 
                            placeholder="Enter new password..."
                            value={password}
                            onChange={e => setPassword(e.target.value)} 
                            required 
                        />
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Confirm Password</Form.Label>
                        <Form.Control 
                            type="password" 
                            placeholder="Confirm new password..."
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)} 
                            required 
                        />
                    </Form.Group>
                    
                    <Button className="tcg-btn w-100" variant="danger" type="submit" disabled={loading}>
                        {loading ? 'UPDATING...' : 'SAVE PASSWORD'}
                    </Button>
                </Form>
            </Card>
        </Container>
    );
};

export default ResetPassword;