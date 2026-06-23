import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Form, ListGroup } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaStar, FaRegStar, FaShoppingBag, FaArrowLeft, FaCommentDots } from 'react-icons/fa';
import axiosClient from '../api/axiosClient'; 
import '../styles/TCGStyles.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State phục vụ việc gửi Review mới
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Đọc thông tin đăng nhập từ LocalStorage để kiểm tra quyền viết review
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // Hàm lấy chi tiết sản phẩm và các review liên quan từ Backend
  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get(`/products/${id}`);
      setProduct(data);
    } catch (error) {
      console.error("Lỗi lấy chi tiết sản phẩm:", error);
      toast.error("Không thể tải thông tin sản phẩm này!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  // Hàm xử lý Thêm vào giỏ hàng (Đồng bộ cấu hình ID khóa chính tự tăng của Postgres)
  const addToCart = () => {
    if (!product) return;
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const existItem = cartItems.find(x => x.id === product.id);
    
    if (existItem) {
      if (existItem.qty < product.countInStock) {
        existItem.qty += 1;
      } else {
        return toast.error(`Sản phẩm "${product.name}" trong kho không đủ số lượng!`);
      }
    } else {
      cartItems.push({ ...product, qty: 1 });
    }
    
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    window.dispatchEvent(new Event("cartUpdated"));
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng! 🛒`);
  };

  // Hàm xử lý khi người dùng ấn Submit Review
  const submitReviewHandler = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      return toast.warn("Vui lòng nhập nội dung đánh giá!");
    }

    try {
      setSubmittingReview(true);
      
      // Gửi API POST kèm theo thông tin bài viết và ID người dùng hiện tại
      await axiosClient.post(`/products/${id}/reviews`, {
        rating: Number(rating),
        comment: comment,
        userId: userInfo ? userInfo.id : 1 // Lấy ID thực tế từ LocalStorage nếu Backend chưa chạy middleware protect
      });
      
      toast.success("Cảm ơn bạn đã gửi đánh giá sản phẩm! ⭐");
      setComment('');
      setRating(5);
      
      // Re-fetch lại dữ liệu sản phẩm để cập nhật danh sách review mới ngay lập tức
      fetchProductDetail();
    } catch (error) {
      console.error("Lỗi gửi đánh giá:", error);
      toast.error(error.response?.data?.message || "Gửi đánh giá thất bại!");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Hàm vẽ số sao trực quan
  const renderStars = (num) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= num ? <FaStar key={i} className="text-warning me-1" /> : <FaRegStar key={i} className="text-secondary me-1" />
      );
    }
    return stars;
  };

  if (loading) {
    return <Container className="main-layout text-center py-5"><p className="text-muted">Đang tải dữ liệu sản phẩm...</p></Container>;
  }

  if (!product) {
    return (
      <Container className="main-layout text-center py-5">
        <p className="text-muted">Sản phẩm không tồn tại hoặc đã bị xóa.</p>
        <Button as={Link} to="/shop" variant="danger" className="tcg-btn"><FaArrowLeft className="me-2"/> QUAY LẠI TRANG SẢN PHẨM</Button>
      </Container>
    );
  }

  return (
    <Container className="main-layout style-detail" style={{ marginTop: '20px' }}>
      {/* Nút quay lại */}
      <Link to="/shop" className="btn btn-light border mb-4 bg-white shadow-sm fw-bold btn-sm">
        <FaArrowLeft className="me-2" /> QUAY LẠI TRANG SẢN PHẨM
      </Link>

      <Row className="mb-5">
        {/* Khung ảnh lớn bên trái */}
        <Col md={5} className="mb-4">
          <Card className="tcg-card border-0 p-3 shadow-sm bg-white text-center">
            <div className="detail-img-box" style={{ overflow: 'hidden', borderRadius: '8px' }}>
              <img 
                src={product.image} 
                alt={product.name} 
                style={{ width: '100%', maxHeight: '450px', objectFit: 'contain' }} 
              />
            </div>
          </Card>
        </Col>

        {/* Khung thông tin mua hàng bên phải */}
        <Col md={7}>
          <div className="ps-md-3">
            <h1 className="fw-bold text-dark mb-2">{product.name}</h1>
            
            <div className="d-flex align-items-center mb-3 flex-wrap gap-2">
              <span className="badge bg-primary px-3 py-2">{product.gameType}</span>
              {product.CategoryData?.name && (
                <span className="badge bg-secondary px-3 py-2">{product.CategoryData.name}</span>
              )}
              {product.RarityData?.name && (
                <span className="badge bg-warning text-dark px-3 py-2 fw-bold">Rarity: {product.RarityData.name}</span>
              )}
            </div>

            <hr />

            <h2 className="text-danger fw-bold fs-1 my-3">
              {Number(product.price).toLocaleString()}đ
            </h2>

            <div className="mb-4">
              <span className="fw-bold">Tình trạng kho: </span>
              {product.countInStock > 0 ? (
                <span className="text-success fw-bold">Còn hàng ({product.countInStock} sản phẩm)</span>
              ) : (
                <span className="text-danger fw-bold">Hết hàng tạm thời</span>
              )}
            </div>

            {/* Ô hiển thị Description */}
            <Card className="border-0 bg-light p-3 mb-4 shadow-sm" style={{ borderLeft: '4px solid #dc3545' }}>
              <Card.Title className="fw-bold text-dark small text-uppercase">Mô tả sản phẩm</Card.Title>
              <Card.Body className="p-0 text-muted" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                {product.description || "Sản phẩm này chưa có bài viết mô tả chi tiết."}
              </Card.Body>
            </Card>

            <Button 
              className="tcg-btn py-3 px-5 fs-5 w-100 shadow-sm" 
              variant={product.countInStock > 0 ? "warning" : "secondary"}
              disabled={product.countInStock <= 0}
              onClick={addToCart}
            >
              <FaShoppingBag className="me-2" /> {product.countInStock > 0 ? "THÊM VÀO GIỎ HÀNG NGAY" : "HẾT HÀNG TẠM THỜI"}
            </Button>
          </div>
        </Col>
      </Row>

      {/* HỆ THỐNG REVIEWS BÊN DƯỚI SẢN PHẨM */}
      <Row className="mt-5 pt-3">
        <Col lg={8} className="mx-auto">
          <h3 className="fw-bold border-bottom pb-3 mb-4 text-dark">
            <FaCommentDots className="text-danger me-2"/>ĐÁNH GIÁ TỪ KHÁCH HÀNG
          </h3>

          {/* Form để viết Đánh giá mới */}
          <Card className="border-0 shadow-sm p-4 mb-4 bg-white rounded-3">
            <h5 className="fw-bold text-dark mb-3">Gửi nhận xét của bạn</h5>
            {userInfo ? (
              <Form onSubmit={submitReviewHandler}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Chọn số sao đánh giá:</Form.Label>
                  <Form.Select 
                    className="tcg-input w-25" 
                    value={rating} 
                    onChange={(e) => setRating(e.target.value)}
                  >
                    <option value="5">5 Sao ⭐⭐⭐⭐⭐</option>
                    <option value="4">4 Sao ⭐⭐⭐⭐</option>
                    <option value="3">3 Sao ⭐⭐⭐</option>
                    <option value="2">2 Sao ⭐⭐</option>
                    <option value="1">1 Sao ⭐</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Nội dung bình luận:</Form.Label>
                  <Form.Control
                    className="tcg-input"
                    as="textarea"
                    rows={3}
                    placeholder="Thẻ bài có mới không? Đóng gói hộp như thế nào? Chia sẻ trải nghiệm của bạn nhé..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button 
                  type="submit" 
                  variant="danger" 
                  className="tcg-btn px-4" 
                  disabled={submittingReview}
                >
                  {submittingReview ? "Đang gửi..." : "GỬI ĐÁNH GIÁ"}
                </Button>
              </Form>
            ) : (
              <div className="alert alert-warning border-0 m-0 py-3 small text-center fw-bold">
                Bạn cần <Link to="/login" className="text-danger decoration-none">Đăng nhập</Link> để viết bình luận và đánh giá cho thẻ bài này!
              </div>
            )}
          </Card>

          {/* Hiển thị danh sách các review cũ */}
          <div className="review-list">
            {/* 🌟 ĐỒNG BỘ FIX: Đổi từ product.ReviewsData thành product.reviews khớp với alias Backend */}
            {!product.reviews || product.reviews.length === 0 ? (
              <p className="text-muted text-center py-4 bg-light rounded-3">Chưa có lượt đánh giá nào cho sản phẩm này. Hãy là người đầu tiên nhận xét!</p>
            ) : (
              <ListGroup variant="flush" className="shadow-sm rounded-3 overflow-hidden">
                {product.reviews.map((review) => (
                  <ListGroup.Item key={review.id} className="p-3 bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      {/* Tên khách hàng (Được Eager Load từ UserData ở backend) */}
                      <strong className="text-dark">{review.UserData?.name || "Khách hàng ẩn danh"}</strong>
                      <small className="text-muted">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </small>
                    </div>
                    <div className="mb-2">
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-secondary m-0 small" style={{ lineHeight: '1.5' }}>
                      {review.comment}
                    </p>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;