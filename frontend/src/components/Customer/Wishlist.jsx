import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ProductCardItem from './ProductCardItem';
import QuickViewModal from './QuickViewModal';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadWishlist = () => {
    const items = JSON.parse(localStorage.getItem('wishlistItems')) || [];
    setWishlistItems(items);
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleToggleWishlist = (product) => {
    let items = JSON.parse(localStorage.getItem('wishlistItems')) || [];
    items = items.filter(x => x.id !== product.id); // Chắc chắn là xóa vì đang ở trang Wishlist
    localStorage.setItem('wishlistItems', JSON.stringify(items));
    setWishlistItems(items);
    window.dispatchEvent(new Event("wishlistUpdated"));
    toast.info("Đã xóa khỏi danh sách yêu thích!");
  };

  const addToCart = (product) => {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const existItem = cartItems.find(x => x.id === product.id);
    if (existItem) {
      if (existItem.qty < product.countInStock) { existItem.qty += 1; } 
      else { return toast.error("Số lượng trong kho không đủ!"); }
    } else {
      cartItems.push({ ...product, qty: 1 });
    }
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    window.dispatchEvent(new Event("cartUpdated"));
    toast.success(`Đã thêm vào giỏ hàng! 🛒`);
  };

  return (
    <Container className="main-layout py-4">
      <h3 className="fw-bold mb-4 text-uppercase fs-4 border-bottom pb-2">Danh sách yêu thích ❤️ ({wishlistItems.length})</h3>
      {wishlistItems.length === 0 ? (
        <Alert variant="info" className="text-center py-4">Danh sách yêu thích của bạn đang trống.</Alert>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {wishlistItems.map(product => (
            <Col key={product.id}>
              <ProductCardItem 
                card={product} 
                addToCart={addToCart}
                onQuickView={(p) => { setSelectedProduct(p); setShowModal(true); }}
                isWishlist={true}
                onToggleWishlist={handleToggleWishlist}
              />
            </Col>
          ))}
        </Row>
      )}

      <QuickViewModal 
        show={showModal} 
        handleClose={() => setShowModal(false)} 
        product={selectedProduct} 
        addToCart={addToCart} 
      />
    </Container>
  );
};

export default Wishlist;