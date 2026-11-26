import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { HiOutlineEnvelope, HiOutlineKey, HiOutlineLockClosed, HiOutlineArrowLeft, HiOutlineCheckCircle } from 'react-icons/hi2';
import '../../styles/TCGStyles.css';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Nhập email gửi OTP, 2: Nhập OTP & đổi mật khẩu
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Bước 1: Gửi mã xác thực OTP về Email
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const { data } = await axiosClient.post('/auth/forgot-password', { email });
            
            // Lọc bỏ thông báo link localhost cũ nếu backend chưa kịp cập nhật
            if (data.message && !data.message.includes('localhost:3000')) {
                setMessage(data.message);
            } else {
                setMessage(`The OTP verification code has been sent to your email ${email}. Please check your inbox (or Spam folder)!`);
            }

            toast.success('The OTP code has been sent to your email!');
            setStep(2);
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Email does not exist or an error occurred!';
            setError(errMsg);
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    // Bước 2: Xác nhận OTP và đặt lại mật khẩu mới
    const handleResetWithOtp = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        // 1. Kiểm tra khớp mật khẩu
        if (password !== confirmPassword) {
            setError('The confirmed password does not match!');
            return toast.error('The confirmed password does not match!');
        }

        // 2. Kiểm tra độ bảo mật: tối thiểu 6 ký tự, có in hoa, có ký tự đặc biệt
        if (password.length < 6) {
            setError('Password must be at least 6 characters long!');
            return toast.error('Password must be at least 6 characters long!');
        }
        if (!/[A-Z]/.test(password)) {
            setError('Password must contain at least one uppercase letter (A-Z)!');
            return toast.error('Password must contain at least one uppercase letter (A-Z)!');
        }
        if (!/[!@#$%^&*(),.?":{}|<>_~-]/.test(password)) {
            setError('Password must contain at least one special character (!@#$%^&*...)!');
            return toast.error('Password must contain at least one special character (!@#$%^&*...)!');
        }

        setLoading(true);
        try {
            const { data } = await axiosClient.post('/auth/reset-password-otp', {
                email,
                otp: otp.trim(),
                password
            });

            toast.success(data.message || 'Password reset successfully!');
            setMessage('Password reset successfully! Redirecting to Login page...');

            setTimeout(() => {
                navigate('/login');
            }, 1800);
        } catch (err) {
            const errMsg = err.response?.data?.message || 'The OTP code is invalid or has expired!';
            setError(errMsg);
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '75vh', paddingTop: '30px', paddingBottom: '30px' }}>
            <Card className="tcg-card p-4 shadow-sm" style={{ width: '430px', borderRadius: '12px' }}>
                <div className="text-center mb-3">
                    <h3 className="fw-bold text-danger">
                        {step === 1 ? 'FORGOT PASSWORD' : 'VERIFY OTP CODE & RESET PASSWORD'}
                    </h3>
                    <p className="text-muted small">
                        {step === 1 
                            ? 'Enter your registered email. The system will send a 6-digit verification OTP code to reset your password.' 
                            : `Enter the 6-digit OTP code sent to your email ${email}`}
                    </p>
                </div>

                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
                {message && <Alert variant="success" className="py-2 small">{message}</Alert>}

                {step === 1 ? (
                    // FORM BƯỚC 1: NHẬP EMAIL
                    <Form onSubmit={handleSendOtp}>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold small text-secondary">
                                <HiOutlineEnvelope className="me-1" /> Email Address
                            </Form.Label>
                            <Form.Control 
                                className="tcg-input" 
                                type="email" 
                                placeholder="name@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)} 
                                required 
                                disabled={loading}
                            />
                        </Form.Group>
                        
                        <Button 
                            className="tcg-btn w-100 py-2 fw-bold" 
                            variant="danger" 
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'SENDING CODE...' : 'SEND VERIFICATION CODE'}
                        </Button>
                        
                        <div className="pt-3 text-center small">
                            <Link to="/login" style={{ color: '#6c757d', textDecoration: 'none', fontWeight: 'bold' }}>
                                <HiOutlineArrowLeft className="me-1" /> Back to Login
                            </Link>
                        </div>
                    </Form>
                ) : (
                    // FORM BƯỚC 2: NHẬP MÃ OTP & MẬT KHẨU MỚI
                    <Form onSubmit={handleResetWithOtp}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small text-secondary">
                                <HiOutlineKey className="me-1 text-warning" /> OTP Verification Code (6 digits)
                            </Form.Label>
                            <Form.Control 
                                className="tcg-input text-center fw-bold fs-5" 
                                type="text" 
                                placeholder="••••••"
                                maxLength={6}
                                value={otp}
                                onChange={e => setOtp(e.target.value)} 
                                required 
                                disabled={loading}
                                style={{ letterSpacing: '4px' }}
                            />
                            <Form.Text className="text-muted small">
                                Check your inbox or spam/junk folder for the email.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small text-secondary">
                                <HiOutlineLockClosed className="me-1" /> New Password
                            </Form.Label>
                            <Form.Control 
                                className="tcg-input" 
                                type="password" 
                                placeholder="At least 6 characters, 1 uppercase, 1 special character"
                                value={password}
                                onChange={e => setPassword(e.target.value)} 
                                required 
                                disabled={loading}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold small text-secondary">
                                <HiOutlineCheckCircle className="me-1" /> Confirm New Password
                            </Form.Label>
                            <Form.Control 
                                className="tcg-input" 
                                type="password" 
                                placeholder="Re-enter new password..."
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)} 
                                required 
                                disabled={loading}
                            />
                        </Form.Group>
                        
                        <Button 
                            className="tcg-btn w-100 py-2 fw-bold mb-3" 
                            variant="danger" 
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'VERIFYING...' : 'CONFIRM PASSWORD RESET'}
                        </Button>

                        <div className="d-flex justify-content-between align-items-center small">
                            <button
                                type="button"
                                className="btn btn-link p-0 text-decoration-none small text-muted"
                                onClick={() => { setStep(1); setMessage(''); setError(''); }}
                                disabled={loading}
                            >
                                <HiOutlineArrowLeft className="me-1" /> Change Email
                            </button>
                            <button
                                type="button"
                                className="btn btn-link p-0 text-decoration-none small text-danger fw-bold"
                                onClick={handleSendOtp}
                                disabled={loading}
                            >
                                Resend OTP Code
                            </button>
                        </div>
                    </Form>
                )}
            </Card>
        </Container>
    );
};

export default ForgotPassword;
