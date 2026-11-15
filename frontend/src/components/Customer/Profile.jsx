import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify'; 
import axiosClient from '../../api/axiosClient'; 
import '../../styles/TCGStyles.css';

const Profile = () => {
  const user = JSON.parse(localStorage.getItem('userInfo'));
  
  // Khởi tạo state từ dữ liệu localStorage hiện tại
  const [name, setName] = useState(user?.name || '');
  const email = user?.email || '';
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [birthday, setBirthday] = useState(user?.birthday || '');
  const [gender, setGender] = useState(user?.gender || 'Not yet disclosed');
  
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
      
      toast.success('Personal information updated successfully!');
    } catch (error) {
      console.error('Error while updating personal information:', error);
      toast.error('Failed to update personal information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="main-layout d-flex justify-content-center" style={{ marginTop: '30px', marginBottom: '30px' }}>
      <Card className="tcg-card p-4 shadow-sm bg-white" style={{ width: '100%', maxWidth: '650px', borderRadius: '12px' }}>
        <h3 className="text-center fw-bold text-danger mb-4">PERSONAL PROFILE</h3>
        
        <Form onSubmit={submitHandler}>
          {/* Hàng 1: Họ tên & Email */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Display Name</Form.Label>
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
                <Form.Label className="fw-bold">Phone Number</Form.Label>
                <Form.Control 
                  className="tcg-input" 
                  type="text"
                  placeholder="Enter phone number for delivery notifications..."
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Gender</Form.Label>
                <Form.Select 
                  className="tcg-input"
                  value={gender} 
                  onChange={e => setGender(e.target.value)}
                >
                  <option value="Not yet disclosed">Not yet disclosed</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Hàng 3: Ngày sinh */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Birthday</Form.Label>
            <Form.Control 
              className="tcg-input" 
              type="date"
              value={birthday} 
              onChange={e => setBirthday(e.target.value)} 
            />
          </Form.Group>

          {/* Hàng 4: Địa chỉ giao hàng mặc định */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Default Shipping Address</Form.Label>
            <Form.Control 
              className="tcg-input" 
              as="textarea"
              rows={2}
              placeholder="Enter detailed address including house number, street name, and delivery area..."
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
            {loading ? 'UPDATING...' : 'UPDATE INFORMATION'}
          </Button>
        </Form>
      </Card>
    </Container>
  );
};

export default Profile;