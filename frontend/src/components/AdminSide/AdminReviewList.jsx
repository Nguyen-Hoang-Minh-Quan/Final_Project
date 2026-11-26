import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Card, Row, Col, Form } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient'; 
import { HiOutlineTrash, HiStar, HiOutlineStar, HiOutlineChatBubbleLeftRight, HiOutlineFunnel, HiOutlineArrowLeft } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom'; 
import { toast } from 'react-toastify';
import '../../styles/TCGStyles.css';

const AdminReviewList = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [filterRating, setFilterRating] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');

  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/reviews'); 
      setReviews(data);
    } catch (err) {
      console.error("Error retrieving the list of reviews:", err);
      toast.error("Cannot load the list of reviews!");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsData = async () => {
    try {
      const { data } = await axiosClient.get('/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllReviews();
    fetchProductsData();
  }, []);

  const deleteReviewHandler = async (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await axiosClient.delete(`/reviews/${id}`);
        toast.success("Review deleted successfully!");
        fetchAllReviews(); 
      } catch (err) {
        toast.error("Failed to delete review!");
      }
    }
  };

  const renderStars = (num) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= num ? <HiStar key={i} className="text-warning me-1" /> : <HiOutlineStar key={i} className="text-secondary me-1" />
      );
    }
    return stars;
  };

  const filteredReviews = reviews.filter(r => {
    const matchRating = filterRating === 'all' ? true : r.rating === Number(filterRating);
    const matchProduct = filterProduct === 'all' ? true : r.productId === Number(filterProduct);
    return matchRating && matchProduct;
  });

  return (
    <Container className="main-layout" style={{ marginTop: '20px' }}>

      <Card className="border-0 shadow-sm p-4 bg-white">
        <Row className="align-items-center mb-4">
          <Col>
            <h2 className="fw-bold mb-0 text-info">
              <HiOutlineChatBubbleLeftRight className="me-2"/>SYSTEM EVALUATION MANAGEMENT
                      <Button variant="outline-secondary" className="border-0" onClick={() => navigate('/admin/')}>
                       <HiOutlineArrowLeft className="me-2"/> GO BACK
                      </Button>
            </h2>
            <small className="text-muted">View, filter, and manage customer reviews</small>
          </Col>
        </Row>

        {/* Thanh Bộ lọc (Filter Bar) */}
        <Card className="bg-light border-0 p-3 mb-4 rounded-3 shadow-sm">
          <Row className="align-items-center">
            <Col md={1} className="d-flex align-items-center text-muted fw-bold mb-2 mb-md-0">
              <HiOutlineFunnel className="me-2"/> FILTER:
            </Col>
            
            <Col md={5} className="mb-2 mb-md-0">
              <Form.Select 
                className="tcg-input" 
                value={filterProduct} 
                onChange={(e) => setFilterProduct(e.target.value)}
              >
                <option value="all">🔍 All products in stock</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Form.Select>
            </Col>

            <Col md={4}>
              <Form.Select 
                className="tcg-input" 
                value={filterRating} 
                onChange={(e) => setFilterRating(e.target.value)}
              >
                <option value="all">⭐ All star ratings</option>
                <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                <option value="3">⭐⭐⭐ 3 Stars</option>
                <option value="2">⭐⭐ 2 Stars</option>
                <option value="1">⭐ 1 Star</option>
              </Form.Select>
            </Col>
            
            <Col md={2} className="text-md-end text-muted small fw-bold">
              Found: {filteredReviews.length} reviews
            </Col>
          </Row>
        </Card>

        {/* Bảng dữ liệu hiển thị */}
        {loading ? (
          <p className="text-center text-muted py-5">Processing review data...</p>
        ) : filteredReviews.length === 0 ? (
          <div className="alert alert-light border text-center py-5 text-muted rounded-3">
            No reviews found matching the filter criteria! Admin can relax. 🎉
          </div>
        ) : (
          <Table responsive hover className="admin-table border-top m-0">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>CUSTOMER</th>
                <th style={{ width: '25%' }}>PRODUCT</th>
                <th className="text-center" style={{ width: '15%' }}>RATING</th>
                <th style={{ width: '35%' }}>CONTENT</th>
                <th className="text-end" style={{ width: '10%' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map(review => (
                <tr key={review.id}>
                  <td className="fw-bold text-dark">{review.UserData?.name || "Anonymous"}</td>
                  <td>
                    <div className="fw-bold text-truncate" style={{ maxWidth: '220px' }}>
                      {review.ProductData?.name || `Product #${review.productId}`}
                    </div>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Date: {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </small>
                  </td>
                  <td className="text-center">{renderStars(review.rating)}</td>
                  <td>
                    <div className="text-secondary small" style={{ whiteSpace: 'pre-line', maxHeight: '60px', overflowY: 'auto' }}>
                      {review.comment}
                    </div>
                  </td>
                  <td className="text-end">
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="border-0" 
                      onClick={() => deleteReviewHandler(review.id)}
                    >
                      <HiOutlineTrash />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </Container>
  );
};

export default AdminReviewList;