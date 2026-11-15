import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaNewspaper, FaPlus, FaTrash, FaEdit, FaChevronLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import '../../styles/TCGStyles.css';

const StaffBlogManagement = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [show, setShow] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [form, setForm] = useState({ title: '', summary: '', content: '', image: '' });

  const fetchBlogs = async () => {
    try {
      const { data } = await axiosClient.get('/blogs');
      setBlogs(data);
    } catch (error) {
      toast.error("Error loading the news list!");
    }
  };

  useEffect(() => { fetchBlogs(); }, []);

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentId(null);
    setForm({ title: '', summary: '', content: '', image: '' });
    setShow(true);
  };

  // Mở modal chỉnh sửa bài viết
  const handleOpenEdit = (blog) => {
    setIsEditing(true);
    setCurrentId(blog.id);
    setForm({
      title: blog.title || '',
      summary: blog.summary || '',
      content: blog.content || '',
      image: blog.image || ''
    });
    setShow(true);
  };

  // Xử lý submit chung cho Create & Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axiosClient.put(`/blogs/${currentId}`, form);
        toast.success("Updated blog post successfully!");
      } else {
        await axiosClient.post('/blogs', form);
        toast.success("New blog post created successfully!");
      }
      setShow(false);
      fetchBlogs();
    } catch (error) {
      toast.error(isEditing ? "Error updating the blog post!" : "Error creating the blog post!");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      try {
        await axiosClient.delete(`/blogs/${id}`);
        toast.success("Blog post deleted successfully!");
        fetchBlogs();
      } catch (error) {
        toast.error("Error deleting the blog post!");
      }
    }
  };

  return (
    <Container className="main-layout py-4">
      <Card className="border-0 shadow-sm p-4">
        <Row className="align-items-center mb-4">
          <Col>
            <h2 className="fw-bold mb-2"><FaNewspaper className="text-danger me-2" />BLOG MANAGEMENT</h2>
            <Button variant="outline-secondary" size="sm" className="border-0 tcg-btn" onClick={() => navigate('/admin')}>
              <FaChevronLeft className="me-1" /> BACK TO DASHBOARD
            </Button>
          </Col>
          <Col className="text-end">
            <Button variant="danger" className="tcg-btn px-4 fw-bold" onClick={handleOpenCreate}>
              <FaPlus className="me-2" /> CREATE NEW POST
            </Button>
          </Col>
        </Row>

        <Table responsive hover className="admin-table border-top">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>IMAGE</th>
              <th>POST TITLE</th>
              <th>AUTHOR</th>
              <th>POST DATE</th>
              <th className="text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((b) => (
              <tr key={b.id}>
                <td>
                  <img 
                    src={b.image || 'https://via.placeholder.com/60'} 
                    alt="" 
                    style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} 
                  />
                </td>
                <td>
                  <div className="fw-bold text-dark">{b.title}</div>
                  <small className="text-muted">{b.summary?.substring(0, 60)}...</small>
                </td>
                <td className="fw-bold">{b.AuthorData?.name || 'Staff'}</td>
                <td className="small text-muted">{new Date(b.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="text-end">
                  {/* Nút Sửa */}
                  <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleOpenEdit(b)}>
                    <FaEdit />
                  </Button>
                  {/* Nút Xóa */}
                  <Button variant="outline-danger" size="sm" onClick={() => handleDelete(b.id)}>
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Modal Dùng chung cho Thêm mới & Cập nhật */}
      <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">
              {isEditing ? "EDIT BLOG POST" : "CREATE NEW BLOG POST"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Post Title</Form.Label>
              <Form.Control value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Short Summary </Form.Label>
              <Form.Control value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Image Link</Form.Label>
              <Form.Control value={form.image} onChange={e => setForm({...form, image: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Detailed Content</Form.Label>
              <Form.Control as="textarea" rows={6} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShow(false)}>Cancel</Button>
            <Button type="submit" variant="danger" className="px-4 fw-bold">
              {isEditing ? "SAVE CHANGES" : "POST BLOG"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default StaffBlogManagement;