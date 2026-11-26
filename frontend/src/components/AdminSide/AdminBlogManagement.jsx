import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { HiOutlineNewspaper, HiOutlinePlus, HiOutlineTrash, HiOutlineChevronLeft } from 'react-icons/hi2';
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
      toast.error("Error loading the news list!");
    }
  };

  useEffect(() => { fetchBlogs(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/blogs', form);
      toast.success("New post published successfully!");
      setShow(false);
      setForm({ title: '', summary: '', content: '', image: '' });
      fetchBlogs();
    } catch (error) {
      toast.error("Error publishing the post!");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await axiosClient.delete(`/blogs/${id}`);
        toast.success("Post deleted successfully!");
        fetchBlogs();
      } catch (error) {
        toast.error("Error deleting the post!");
      }
    }
  };

  return (
    <Container className="main-layout py-4">
      <Card className="border-0 shadow-sm p-4">
        <Row className="align-items-center mb-4">
          <Col>
            <h2 className="fw-bold mb-2"><HiOutlineNewspaper className="text-danger me-2" />BLOG MANAGEMENT</h2>
            <Button variant="outline-secondary" size="sm" className="border-0 tcg-btn" onClick={() => navigate('/admin')}>
              <HiOutlineChevronLeft className="me-1" /> GO BACK
            </Button>
          </Col>
          <Col className="text-end">
            <Button variant="danger" className="tcg-btn px-4" onClick={() => setShow(true)}>
              <HiOutlinePlus className="me-2" /> CREATE NEW POST
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
                <td><img src={b.image || 'https://via.placeholder.com/60'} alt="" style={{ width: '60px', borderRadius: '4px' }} /></td>
                <td>
                  <div className="fw-bold text-dark">{b.title}</div>
                  <small className="text-muted">{b.summary?.substring(0, 60)}...</small>
                </td>
                <td className="fw-bold">{b.AuthorData?.name || 'Staff'}</td>
                <td className="small text-muted">{new Date(b.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="text-end">
                  <Button variant="outline-danger" size="sm" onClick={() => handleDelete(b.id)}><HiOutlineTrash /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
        <Form onSubmit={handleCreate}>
          <Modal.Header closeButton><Modal.Title className="fw-bold">CREATE NEW POST</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Post Title</Form.Label>
              <Form.Control value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Short Summary</Form.Label>
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
            <Button type="submit" variant="danger" className="px-4">CREATE POST</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminBlogManagement;