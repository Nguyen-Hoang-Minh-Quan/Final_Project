import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify'; 
import axiosClient from '../api/axiosClient'; 
import '../styles/TCGStyles.css';

const Profile = () => {
  const user = JSON.parse(localStorage.getItem('userInfo'));
  
  // Khởi tạo state từ dữ liệu localStorage hiện tại
  const [name, setName] = useState(user?.name || '');
  const email = user?.email || '';
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [birthday, setBirthday] = useState(user?.birthday || '');
  const [gender, setGender] = useState(user?.gender || 'Chưa tiết lộ');
  
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(false);
    try {
      setLoading(true);
      
      // Lấy token từ cấu trúc user đăng nhập để gán vào Header bảo mật
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      // Gọi API PUT cập nhật thông tin cá nhân lên endpoint auth/profile
      const { data } = await axiosClient.put(
        'http://localhost:5000/api/auth/profile', // Điều chỉnh lại đúng URL backend của bạn
        { name, phone, address, birthday, gender },
        config
      );

      // Cập nhật cục dữ liệu mới nhận từ API vào localStorage để đồng bộ hiển thị
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      toast.success('Cập nhật thông tin cá nhân thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin cá nhân:', error);
      toast.error('Cập nhật thông tin cá nhân thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="main-layout d-flex justify-content-center" style={{ marginTop: '30px', marginBottom: '30px' }}>
      <Card className="tcg-card p-4 shadow-sm bg-white" style={{ width: '100%', maxWidth: '650px', borderRadius: '12px' }}>
        <h3 className="text-center fw-bold text-danger mb-4">HỒ SƠ CÁ NHÂN</h3>
        
        <Form onSubmit={submitHandler}>
          {/* Hàng 1: Họ tên & Email */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Tên người dùng</Form.Label>
                <Form.Control 
                  className="tcg-input" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Email</Form.Label>
                <Form.Control 
                  className="tcg-input" 
                  value={email} 
                  disabled 
                  style={{ backgroundColor: '#f1f3f5', cursor: 'not-allowed' }}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Hàng 2: Số điện thoại & Giới tính */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Số điện thoại</Form.Label>
                <Form.Control 
                  className="tcg-input" 
                  type="text"
                  placeholder="Nhập số điện thoại nhận hàng"
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Giới tính</Form.Label>
                <Form.Select 
                  className="tcg-input"
                  value={gender} 
                  onChange={e => setGender(e.target.value)}
                >
                  <option value="Chưa tiết lộ">Chưa tiết lộ</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Hàng 3: Ngày sinh */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Ngày sinh</Form.Label>
            <Form.Control 
              className="tcg-input" 
              type="date"
              value={birthday} 
              onChange={e => setBirthday(e.target.value)} 
            />
          </Form.Group>

          {/* Hàng 4: Địa chỉ giao hàng mặc định */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Địa chỉ giao hàng mặc định</Form.Label>
            <Form.Control 
              className="tcg-input" 
              as="textarea"
              rows={2}
              placeholder="Nhập chi tiết số nhà, tên đường, khu vực nhận thẻ bài..."
              value={address} 
              onChange={e => setAddress(e.target.value)} 
            />
          </Form.Group>

          {/* Nút submit kích hoạt gửi form */}
          <Button 
            className="tcg-btn w-100 fw-bold py-2" 
            variant="danger" 
            type="submit"
            disabled={loading}
          >
            {loading ? 'ĐANG XỬ LÝ...' : 'CẬP NHẬT THÔNG TIN'}
          </Button>
        </Form>
      </Card>
    </Container>
  );
};

export default Profile;