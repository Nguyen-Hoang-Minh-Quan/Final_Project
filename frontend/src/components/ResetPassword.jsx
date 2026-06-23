import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify'; // 🌟 IMPORT TOAST
import '../styles/TCGStyles.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { token } = useParams(); 
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();

        // 🌟 BÁO LỖI SO KHỚP QUA TOAST NGAY LẬP TỨC
        if (password !== confirmPassword) {
            return toast.error('Mật khẩu xác nhận không trùng khớp!');
        }

        setLoading(true);
        try {
            const { data } = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, { password });
            
            // 🌟 THÔNG BÁO ĐỔI MẬT KHẨU THÀNH CÔNG
            toast.success(data.message || 'Đặt lại mật khẩu thành công!');
            
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            // 🌟 THÔNG BÁO KHI TOKEN HẾT HẠN HOẶC SAI LỖI
            toast.error(err.response?.data?.message || 'Liên kết đã hết hạn hoặc không hợp lệ!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
            <Card className="tcg-card p-4 shadow" style={{ width: '400px' }}>
                <h3 className="text-center fw-bold text-danger mb-4">MẬT KHẨU MỚI</h3>

                <Form onSubmit={submitHandler}>
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Mật khẩu mới</Form.Label>
                        <Form.Control 
                            className="tcg-input" 
                            type="password" 
                            placeholder="Nhập mật khẩu mới..."
                            value={password}
                            onChange={e => setPassword(e.target.value)} 
                            required 
                        />
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Xác nhận mật khẩu</Form.Label>
                        <Form.Control 
                            className="tcg-input" 
                            type="password" 
                            placeholder="Nhập lại mật khẩu mới..."
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)} 
                            required 
                        />
                    </Form.Group>
                    
                    <Button className="tcg-btn w-100" variant="danger" type="submit" disabled={loading}>
                        {loading ? 'ĐANG CẬP NHẬT...' : 'LƯU MẬT KHẨU'}
                    </Button>
                </Form>
            </Card>
        </Container>
    );
};

export default ResetPassword;