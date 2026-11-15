import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaLock, FaCheckCircle, FaShieldAlt } from 'react-icons/fa';
import '../../styles/TCGStyles.css';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Kiểm tra khớp mật khẩu
    if (formData.password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp!');
      return toast.error('Mật khẩu xác nhận không trùng khớp!');
    }

    // 2. Kiểm tra độ mạnh mật khẩu (bảo mật: >= 6 ký tự, có chữ in hoa, có ký tự đặc biệt)
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có độ dài tối thiểu 6 ký tự!');
      return toast.error('Mật khẩu phải có độ dài tối thiểu 6 ký tự!');
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('Mật khẩu phải chứa ít nhất 1 chữ cái in hoa (A-Z)!');
      return toast.error('Mật khẩu cần ít nhất 1 chữ in hoa!');
    }
    if (!/[!@#$%^&*(),.?":{}|<>_~-]/.test(formData.password)) {
      setError('Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)!');
      return toast.error('Mật khẩu cần ít nhất 1 ký tự đặc biệt!');
    }

    setLoading(true);
    try {
      await axiosClient.post('/auth/register', formData);
      
      toast.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.'); 
      navigate('/login');
    } catch (err) { 
      const errMsg = err.response?.data?.message || 'Lỗi khi đăng ký tài khoản!';
      setError(errMsg);
      toast.error(errMsg); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="main-layout d-flex justify-content-center align-items-center" style={{ minHeight: '80vh', paddingTop: '30px', paddingBottom: '30px' }}>
      <Card className="tcg-card p-4 shadow-sm" style={{ width: '420px', borderRadius: '12px' }}>
        <div className="text-center mb-3">
          <h3 className="fw-bold text-danger">ĐĂNG KÝ TÀI KHOẢN</h3>
          <p className="text-muted small">Tạo tài khoản để bắt đầu sưu tầm thẻ bài TCG</p>
        </div>

        {error && (
          <Alert variant="danger" className="py-2 small d-flex align-items-center">
            <FaShieldAlt className="me-2 flex-shrink-0" />
            <span>{error}</span>
          </Alert>
        )}

        <Form onSubmit={handleRegister}>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-secondary">
              <FaUser className="me-1" /> Tên hiển thị
            </Form.Label>
            <Form.Control 
              className="tcg-input" 
              placeholder="VD: Quân Minh"
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              required 
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-secondary">
              <FaEnvelope className="me-1" /> Địa chỉ Email
            </Form.Label>
            <Form.Control 
              className="tcg-input" 
              type="email" 
              placeholder="name@example.com"
              onChange={e => setFormData({ ...formData, email: e.target.value })} 
              required 
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-secondary">
              <FaLock className="me-1" /> Mật khẩu
            </Form.Label>
            <Form.Control 
              className="tcg-input" 
              type="password" 
              placeholder="Tối thiểu 6 ký tự, 1 in hoa, 1 ký tự đặc biệt"
              onChange={e => setFormData({ ...formData, password: e.target.value })} 
              required 
              disabled={loading}
            />
            <Form.Text className="text-muted" style={{ fontSize: '11px' }}>
              🔒 Yêu cầu bảo mật: Có ít nhất 1 chữ in hoa và 1 ký tự đặc biệt (!@#$%^&*...)
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="small fw-bold text-secondary">
              <FaCheckCircle className="me-1" /> Xác nhận mật khẩu
            </Form.Label>
            <Form.Control 
              className="tcg-input" 
              type="password" 
              placeholder="Nhập lại mật khẩu..."
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} 
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
            {loading ? 'ĐANG TẠO TÀI KHOẢN...' : 'ĐĂNG KÝ NGAY'}
          </Button>

          <div className="py-3 text-center small">
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: '#dc3545', fontWeight: 'bold', textDecoration: 'none' }}>
              Đăng nhập tại đây
            </Link>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default Register;
