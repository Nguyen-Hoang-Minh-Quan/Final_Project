import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import '../../styles/TCGStyles.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
            const { data } = await axiosClient.post(`/auth/reset-password/${token}`, { password });
            
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
                        <div className="position-relative">
                            <Form.Control 
                                className="tcg-input pe-5" 
                                type={showPassword ? 'text' : 'password'} 
                                placeholder="Enter new password..."
                                value={password}
                                onChange={e => setPassword(e.target.value)} 
                                required 
                            />
                            <button
                                type="button"
                                className="btn border-0 bg-transparent text-secondary position-absolute top-50 end-0 translate-middle-y me-1 p-2 shadow-none"
                                onClick={() => setShowPassword(prev => !prev)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <HiOutlineEyeSlash size={20} /> : <HiOutlineEye size={20} />}
                            </button>
                        </div>
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Confirm Password</Form.Label>
                        <div className="position-relative">
                            <Form.Control 
                                className="tcg-input pe-5" 
                                type={showConfirmPassword ? 'text' : 'password'} 
                                placeholder="Confirm new password..."
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)} 
                                required 
                            />
                            <button
                                type="button"
                                className="btn border-0 bg-transparent text-secondary position-absolute top-50 end-0 translate-middle-y me-1 p-2 shadow-none"
                                onClick={() => setShowConfirmPassword(prev => !prev)}
                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                            >
                                {showConfirmPassword ? <HiOutlineEyeSlash size={20} /> : <HiOutlineEye size={20} />}
                            </button>
                        </div>
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