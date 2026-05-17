import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import '../styles/TCGStyles.css';

const Profile = () => {
  const user = JSON.parse(localStorage.getItem('userInfo'));
  const [name, setName] = useState(user?.name || '');
  const email = user?.email || '';

  return (
    <Container className="main-layout d-flex justify-content-center">
      <Card className="tcg-card p-4 shadow" style={{width: '450px'}}>
        <h3 className="text-center fw-bold text-danger mb-4">HỒ SƠ CÁ NHÂN</h3>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Tên người dùng</Form.Label>
            <Form.Control className="tcg-input" value={name} onChange={e => setName(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Email</Form.Label>
            <Form.Control className="tcg-input" value={email} disabled />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Mật khẩu mới</Form.Label>
            <Form.Control className="tcg-input" type="password" placeholder="Nhập mật khẩu mới nếu muốn thay đổi" />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Xác nhận mật khẩu</Form.Label>
            <Form.Control className="tcg-input" type="password" placeholder="Nhập lại mật khẩu mới" />
          </Form.Group>
          <Button className="tcg-btn w-100" variant="danger">CẬP NHẬT THÔNG TIN</Button>
        </Form>
      </Card>
    </Container>
  );
};
export default Profile;