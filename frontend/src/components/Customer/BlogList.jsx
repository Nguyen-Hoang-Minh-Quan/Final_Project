import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaNewspaper, FaCalendarAlt, FaUserEdit } from 'react-icons/fa';
import axiosClient from '../../api/axiosClient';
import '../../styles/TCGStyles.css';

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data } = await axiosClient.get('/blogs');
        setBlogs(data);
      } catch (error) {
        console.error("Error retrieving the list of articles:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  return (
    <Container className="main-layout py-4">
      <h2 className="section-title text-uppercase mb-4">
        <FaNewspaper className="me-2 text-danger" /> News & TCG Guides
      </h2>

      {blogs.length === 0 ? (
        <Card className="tcg-card p-5 text-center shadow-sm">
          <p className="fs-5 text-muted m-0">No articles or news available!</p>
        </Card>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {blogs.map((blog) => (
            <Col key={blog.id}>
              <Card className="tcg-card h-100 border-0 shadow-sm overflow-hidden">
                {/* Khung chứa ảnh có cơ chế dự phòng khi link ảnh trống hoặc lỗi */}
                <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
                  <Card.Img
                    variant="top"
                    src={blog.image && blog.image.trim() !== '' ? blog.image : 'https://via.placeholder.com/400x250?text=TCG+News'}
                    alt={blog.title}
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain',
                        padding: '12px'
                    }}
                    onError={(e) => { 
                      e.target.src = 'https://via.placeholder.com/400x250?text=TCG+News'; 
                    }}
                  />
                </div>

                <Card.Body className="d-flex flex-column p-3">
                  <div className="d-flex align-items-center justify-content-between text-muted small mb-2">
                    <span>
                      <FaCalendarAlt className="me-1" />
                      {new Date(blog.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    {/* Lấy tên tác giả chuẩn từ AuthorData của backend */}
                    {blog.AuthorData?.name && (
                      <Badge bg="secondary" className="fw-normal">
                        <FaUserEdit className="me-1" /> {blog.AuthorData.name}
                      </Badge>
                    )}
                  </div>

                  <Card.Title className="fw-bold fs-6 text-dark mb-2 text-truncate">
                    <Link to={`/blogs/${blog.id}`} className="text-decoration-none text-dark hover-danger">
                      {blog.title}
                    </Link>
                  </Card.Title>

                  <Card.Text className="text-secondary small mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {blog.summary || blog.content?.substring(0, 100) + '...'}
                  </Card.Text>

                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default BlogList;