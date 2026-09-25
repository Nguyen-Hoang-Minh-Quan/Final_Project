import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Card, Row, Col, Form } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient'; 
import { FaTrash, FaStar, FaRegStar, FaComments, FaFilter, FaArrowLeft } from 'react-icons/fa';
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
      console.error("Lỗi lấy danh sách đánh giá:", err);
      toast.error("Không thể tải danh sách đánh giá hệ thống!");
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
    if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) {
      try {
        await axiosClient.delete(`/reviews/${id}`);
        toast.success("Đã xóa đánh giá thành công!");
        fetchAllReviews(); 
      } catch (err) {
        toast.error("Xóa đánh giá thất bại!");
      }
    }
  };

  const renderStars = (num) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= num ? <FaStar key={i} className="text-warning me-1" /> : <FaRegStar key={i} className="text-secondary me-1" />
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
              <FaComments className="me-2"/>QUẢN LÝ ĐÁNH GIÁ HỆ THỐNG
                      <Button variant="outline-secondary" className="border-0" onClick={() => navigate('/admin/')}>
                       <FaArrowLeft className="me-2"/> Quay lại
                      </Button>
            </h2>
            <small className="text-muted">Xem, lọc và dọn dẹp các bình luận từ khách hàng</small>
          </Col>
        </Row>

        {/* Thanh Bộ lọc (Filter Bar) */}
        <Card className="bg-light border-0 p-3 mb-4 rounded-3 shadow-sm">
          <Row className="align-items-center">
            <Col md={1} className="d-flex align-items-center text-muted fw-bold mb-2 mb-md-0">
              <FaFilter className="me-2"/> LỌC:
            </Col>
            
            <Col md={5} className="mb-2 mb-md-0">
              <Form.Select 
                className="tcg-input" 
                value={filterProduct} 
                onChange={(e) => setFilterProduct(e.target.value)}
              >
                <option value="all">🔍 Tất cả sản phẩm trong kho</option>
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
                <option value="all">⭐ Tất cả mức sao</option>
                <option value="5">⭐⭐⭐⭐⭐ 5 Sao</option>
                <option value="4">⭐⭐⭐⭐ 4 Sao</option>
                <option value="3">⭐⭐⭐ 3 Sao</option>
                <option value="2">⭐⭐ 2 Sao</option>
                <option value="1">⭐ 1 Sao</option>
              </Form.Select>
            </Col>
            
            <Col md={2} className="text-md-end text-muted small fw-bold">
              Tìm thấy: {filteredReviews.length} nhận xét
            </Col>
          </Row>
        </Card>

        {/* Bảng dữ liệu hiển thị */}
        {loading ? (
          <p className="text-center text-muted py-5">Đang xử lý dữ liệu đánh giá...</p>
        ) : filteredReviews.length === 0 ? (
          <div className="alert alert-light border text-center py-5 text-muted rounded-3">
            Không tìm thấy đánh giá nào khớp với điều kiện lọc! Admin có thể thảnh thơi rồi. 🎉
          </div>
        ) : (
          <Table responsive hover className="admin-table border-top m-0">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>KHÁCH HÀNG</th>
                <th style={{ width: '25%' }}>SẢN PHẨM</th>
                <th className="text-center" style={{ width: '15%' }}>ĐÁNH GIÁ</th>
                <th style={{ width: '35%' }}>NỘI DUNG</th>
                <th className="text-end" style={{ width: '10%' }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map(review => (
                <tr key={review.id}>
                  <td className="fw-bold text-dark">{review.UserData?.name || "Ẩn danh"}</td>
                  <td>
                    <div className="fw-bold text-truncate" style={{ maxWidth: '220px' }}>
                      {review.ProductData?.name || `Sản phẩm #${review.productId}`}
                    </div>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Ngày: {new Date(review.createdAt).toLocaleDateString('vi-VN')}
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
                      <FaTrash />
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