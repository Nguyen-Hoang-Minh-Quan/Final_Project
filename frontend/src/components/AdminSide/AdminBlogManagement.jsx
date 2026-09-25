import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaNewspaper, FaPlus, FaTrash, FaChevronLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import '../../styles/TCGStyles.css';

const AdminBlogManagement = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: '', summary: '', content: '', image: '' });

  const fetchBlogs = async () => {
    try {
      const { data } = await axiosClient.get('/blogs');
      setBlogs(data);
    } catch (error) {
      toast.error("Lỗi tải danh sách tin tức!");
    }
  };

  useEffect(() => { fetchBlogs(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/blogs', form);
      toast.success("Đăng bài viết mới thành công!");
      setShow(false);
      setForm({ title: '', summary: '', content: '', image: '' });
      fetchBlogs();
    } catch (error) {
      toast.error("Lỗi khi đăng bài!");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      try {
        await axiosClient.delete(`/blogs/${id}`);
        toast.success("Đã xóa bài viết!");
        fetchBlogs();
      } catch (error) {
        toast.error("Lỗi xóa bài!");
      }
    }
  };

  return (
    <Container className="main-layout py-4">
      <Card className="border-0 shadow-sm p-4">
        <Row className="align-items-center mb-4">
          <Col>
            <h2 className="fw-bold mb-2"><FaNewspaper className="text-danger me-2" />QUẢN LÝ TIN TỨC & CẨM NANG</h2>
            <Button variant="outline-secondary" size="sm" className="border-0 tcg-btn" onClick={() => navigate('/admin')}>
              <FaChevronLeft className="me-1" /> QUAY LẠI
            </Button>
          </Col>
          <Col className="text-end">
            <Button variant="danger" className="tcg-btn px-4" onClick={() => setShow(true)}>
              <FaPlus className="me-2" /> ĐĂNG BÀI MỚI
            </Button>
          </Col>
        </Row>

        <Table responsive hover className="admin-table border-top">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>HÌNH</th>
              <th>TIÊU ĐỀ BÀI VIẾT</th>
              <th>TÁC GIẢ</th>
              <th>NGÀY ĐĂNG</th>
              <th className="text-end">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((b) => (
              <tr key={b.id}>
                <td><img src={b.image || 'https://via.placeholder.com/60'} alt="" style={{ width: '60px', borderRadius: '4px' }} /></td>
                <td>
                  <div className="fw-bold text-dark">{b.title}</div>
                  <small className="text-muted">{b.summary?.substring(0, 60)}...</small>
                </td>
                <td className="fw-bold">{b.AuthorData?.name || 'Staff'}</td>
                <td className="small text-muted">{new Date(b.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="text-end">
                  <Button variant="outline-danger" size="sm" onClick={() => handleDelete(b.id)}><FaTrash /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
        <Form onSubmit={handleCreate}>
          <Modal.Header closeButton><Modal.Title className="fw-bold">ĐĂNG BÀI VIẾT TCG MỚI</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Tiêu đề bài viết</Form.Label>
              <Form.Control value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Tóm tắt ngắn</Form.Label>
              <Form.Control value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Link Ảnh ảnh bài viết</Form.Label>
              <Form.Control value={form.image} onChange={e => setForm({...form, image: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Nội dung chi tiết</Form.Label>
              <Form.Control as="textarea" rows={6} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShow(false)}>Hủy</Button>
            <Button type="submit" variant="danger" className="px-4">ĐĂNG BÀI</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminBlogManagement;