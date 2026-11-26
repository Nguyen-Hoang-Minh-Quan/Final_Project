import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Card, Form, ListGroup } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { HiStar, HiOutlineStar, HiHeart, HiOutlineHeart, HiOutlineShoppingBag, HiOutlineArrowLeft, HiOutlineChatBubbleOvalLeftEllipsis } from 'react-icons/hi2';
import axiosClient from '../../api/axiosClient'; 
import ProductCardItem from './ProductCardItem';
import QuickViewModal from './QuickViewModal';
import '../../styles/TCGStyles.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State phục vụ việc gợi ý sản phẩm liên quan và wishlist
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // State phục vụ việc gửi Review mới
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Đọc thông tin đăng nhập từ LocalStorage để kiểm tra quyền viết review
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  // Hàm đồng bộ danh sách ID sản phẩm đang nằm trong Wishlist từ LocalStorage
  const loadWishlistIds = () => {
    const items = JSON.parse(localStorage.getItem('wishlistItems')) || [];
    setWishlistIds(items.map(x => x.id));
  };

  // Hàm lấy chi tiết sản phẩm và các review liên quan từ Backend
  const fetchProductDetail = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get(`/products/${id}`);
      setProduct(data);
      loadWishlistIds();

      if (data.categoryId) {
        const prodRes = await axiosClient.get('/products');
        
        // 1. Lọc các sản phẩm cùng categoryId và loại trừ sản phẩm hiện tại đang xem
        const filtered = prodRes.data.filter(
          p => Number(p.categoryId) === Number(data.categoryId) && p.id !== data.id
        );

        // 2. Thuật toán Fisher-Yates Shuffle để xáo trộn ngẫu nhiên mảng filtered
        for (let i = filtered.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [filtered[i], filtered[j]] = [filtered[j], filtered[i]]; // Đổi chỗ 2 phần tử ngẫu nhiên
        }

        // 3. Cắt lấy tối đa 4 sản phẩm đầu tiên sau khi đã trộn ngẫu nhiên
        const randomRelated = filtered.slice(0, 4);
        
        setRelatedProducts(randomRelated);
      }
    } catch (error) {
      console.error("Error retrieving product details:", error);
      toast.error("Unable to load this product information!");
    } finally {
      setLoading(false);
    }
  }, [id]);
    useEffect(() => {
    fetchProductDetail();
  }, [fetchProductDetail]);

  // Hàm xử lý Thêm vào giỏ hàng sản phẩm hiện tại
  const addToCart = () => {
    if (!product) return;
    handleAddToCartLogic(product);
  };

  // Hàm xử lý logic thêm vào giỏ hàng dùng chung (áp dụng cho cả sản phẩm chính và hàng liên quan)
  const handleAddToCartLogic = (prod) => {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const existItem = cartItems.find(x => x.id === prod.id);
    
    if (existItem) {
      if (existItem.qty < prod.countInStock) {
        existItem.qty += 1;
      } else {
        return toast.error(`Product "${prod.name}" is out of stock!`);
      }
    } else {
      cartItems.push({ ...prod, qty: 1 });
    }
    
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    const uInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (uInfo && uInfo.id) {
      localStorage.setItem(`cartItems_${uInfo.id}`, JSON.stringify(cartItems));
    }
    window.dispatchEvent(new Event("cartUpdated"));
    toast.success(`Added "${prod.name}" to cart!`);
  };

  // Hàm xử lý thêm/xóa sản phẩm khỏi danh sách yêu thích (Wishlist)
  const handleToggleWishlist = (p) => {
    let items = JSON.parse(localStorage.getItem('wishlistItems')) || [];
    const isExist = items.find(x => x.id === p.id);
    
    if (isExist) {
      items = items.filter(x => x.id !== p.id);
      toast.info("Removed from wishlist!");
    } else {
      items.push(p);
      toast.success("Added to wishlist!");
    }
    
    localStorage.setItem('wishlistItems', JSON.stringify(items));
    setWishlistIds(items.map(x => x.id));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  // Hàm xử lý khi người dùng ấn Submit Review
  const submitReviewHandler = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      return toast.warn("Please enter a review comment!");
    }

    try {
      setSubmittingReview(true);
      
      // Gửi API POST kèm theo thông tin bài viết và ID người dùng hiện tại
      await axiosClient.post(`/products/${id}/reviews`, {
        rating: Number(rating),
        comment: comment,
        userId: userInfo ? userInfo.id : 1 // Lấy ID thực tế từ LocalStorage nếu Backend chưa chạy middleware protect
      });
      
      toast.success("Thank you for submitting your product review!");
      setComment('');
      setRating(5);
      
      // Re-fetch lại dữ liệu sản phẩm để cập nhật danh sách review mới ngay lập tức
      fetchProductDetail();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.message || "Failed to submit review!");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Hàm vẽ số sao trực quan
  const renderStars = (num) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= num ? <HiStar key={i} className="text-warning me-1" /> : <HiOutlineStar key={i} className="text-secondary me-1" />
      );
    }
    return stars;
  };

  if (loading) {
    return <Container className="main-layout text-center py-5"><p className="text-muted">Loading product data...</p></Container>;
  }

  if (!product) {
    return (
      <Container className="main-layout text-center py-5">
        <p className="text-muted">Product does not exist or has been deleted.</p>
        <Button as={Link} to="/shop" variant="danger" className="tcg-btn"><HiOutlineArrowLeft className="me-2"/> RETURN TO PRODUCT PAGE</Button>
      </Container>
    );
  }

  return (
    <Container className="main-layout style-detail" style={{ marginTop: '20px' }}>
      {/* Nút quay lại */}
      <Link to="/shop" className="btn btn-light border mb-4 bg-white shadow-sm fw-bold btn-sm">
        <HiOutlineArrowLeft className="me-2" /> RETURN TO PRODUCT PAGE
      </Link>

      <Row className="mb-5">
        {/* Khung ảnh lớn bên trái */}
        <Col md={5} className="mb-4">
          <Card className="tcg-card border-0 p-3 shadow-sm bg-white text-center position-relative">
            {/* Nút Trái tim Wishlist cho sản phẩm chính ngay góc ảnh */}
            <button
              onClick={() => handleToggleWishlist(product)}
              className="position-absolute top-0 end-0 m-3 z-1 bg-light border-0 rounded-circle shadow-sm d-flex align-items-center justify-content-center p-2"
              style={{ width: '40px', height: '40px' }}
            >
              {wishlistIds.includes(product.id) ? <HiHeart className="text-danger" size={20} /> : <HiOutlineHeart className="text-muted" size={20} />}
            </button>
            
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
              <span className="fw-bold">Inventory status: </span>
              {product.countInStock > 0 ? (
                <span className="text-success fw-bold">In Stock ({product.countInStock} items)</span>
              ) : (
                <span className="text-danger fw-bold">Out of Stock</span>
              )}
            </div>

            {/* Ô hiển thị Description */}
            <Card className="border-0 bg-light p-3 mb-4 shadow-sm" style={{ borderLeft: '4px solid #dc3545' }}>
              <Card.Title className="fw-bold text-dark small text-uppercase">Product description</Card.Title>
              <Card.Body className="p-0 text-muted" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                {product.description || "This product does not have a detailed description yet."}
              </Card.Body>
            </Card>

            <Button 
              className="tcg-btn py-3 px-5 fs-5 w-100 shadow-sm" 
              variant={product.countInStock > 0 ? "warning" : "secondary"}
              disabled={product.countInStock <= 0}
              onClick={addToCart}
            >
              <HiOutlineShoppingBag className="me-2" /> {product.countInStock > 0 ? "ADD TO CART NOW" : "TEMPORARILY OUT OF STOCK"}
            </Button>
          </div>
        </Col>
      </Row>
      
      {/* DANH SÁCH SẢN PHẨM LIÊN QUAN (Related Products) */}
      {relatedProducts.length > 0 && (
        <div className="mt-5 pt-4 border-top">
          <h3 className="fw-bold text-dark mb-4 text-uppercase fs-4">Related Products</h3>
          <Row xs={1} sm={2} md={4} className="g-4">
            {relatedProducts.map(card => (
              <Col key={card.id}>
                <ProductCardItem 
                  card={card}
                  addToCart={() => handleAddToCartLogic(card)}
                  onQuickView={(p) => { setSelectedProduct(p); setShowModal(true); }}
                  isWishlist={wishlistIds.includes(card.id)}
                  onToggleWishlist={handleToggleWishlist}
                />
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* HỆ THỐNG REVIEWS BÊN DƯỚI SẢN PHẨM */}
      <Row className="mt-5 pt-3">
        <Col lg={8} className="mx-auto">
          <h3 className="fw-bold border-bottom pb-3 mb-4 text-dark">
            <HiOutlineChatBubbleOvalLeftEllipsis className="text-danger me-2"/>CUSTOMER REVIEWS
          </h3>

          {/* Form để viết Đánh giá mới */}
          <Card className="border-0 shadow-sm p-4 mb-4 bg-white rounded-3">
            <h5 className="fw-bold text-dark mb-3">Share Your Review</h5>
            {userInfo ? (
              <Form onSubmit={submitReviewHandler}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Select Rating:</Form.Label>
                  <Form.Select 
                    className="tcg-input w-25" 
                    value={rating} 
                    onChange={(e) => setRating(e.target.value)}
                  >
                    <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
                    <option value="4">4 Stars ⭐⭐⭐⭐</option>
                    <option value="3">3 Stars ⭐⭐⭐</option>
                    <option value="2">2 Stars ⭐⭐</option>
                    <option value="1">1 Star ⭐</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Review Content:</Form.Label>
                  <Form.Control
                    className="tcg-input"
                    as="textarea"
                    rows={3}
                    placeholder="Is the card new? How is the box packaging? Share your experience here..."
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
                  {submittingReview ? "Submitting..." : "SUBMIT REVIEW"}
                </Button>
              </Form>
            ) : (
              <div className="alert alert-warning border-0 m-0 py-3 small text-center fw-bold">
                You need to <Link to="/login" className="text-danger decoration-none">Log in</Link> to write comments and reviews for this card!
              </div>
            )}
          </Card>

          <div className="review-list">
            {!product.reviews || product.reviews.length === 0 ? (
              <p className="text-muted text-center py-4 bg-light rounded-3">No reviews yet for this product. Be the first to review!</p>
            ) : (
              <ListGroup variant="flush" className="shadow-sm rounded-3 overflow-hidden">
                {product.reviews.map((review) => (
                  <ListGroup.Item key={review.id} className="p-3 bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong className="text-dark">{review.UserData?.name || "Anonymous Customer"}</strong>
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
                    {review.reply && (
                      <div className="mt-2 p-2 bg-light rounded small">
                        <strong className="text-success">Response from seller:</strong> {review.reply}
                      </div>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        </Col>
      </Row>

      <QuickViewModal 
        show={showModal} 
        handleClose={() => setShowModal(false)} 
        product={selectedProduct} 
        addToCart={handleAddToCartLogic} 
      />
    </Container>
  );
};

export default ProductDetail;