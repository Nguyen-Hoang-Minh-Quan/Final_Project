import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaEye } from 'react-icons/fa';

const ProductCardItem = ({ card, addToCart, onQuickView, isWishlist, onToggleWishlist, isNew, isHot }) => {
  return (
    <Card className="tcg-card h-100 shadow-sm border-0 position-relative overflow-hidden">
      {/* Khối Badge */}
      {isNew && card.countInStock > 0 && <Badge bg="primary" className="position-absolute top-0 start-0 m-2 z-1">NEW</Badge>}
      {isHot && card.countInStock > 0 && <Badge bg="danger" className="position-absolute top-0 start-0 m-2 z-1">HOT</Badge>}
      {card.countInStock <= 0 && <Badge bg="secondary" className="position-absolute top-0 start-0 m-2 z-1">HẾT HÀNG</Badge>}

      {/* NÚT WISHLIST (TRÁI TIM) ĐỊNH VỊ GÓC TRÊN PHẢI */}
      <button
        onClick={() => onToggleWishlist(card)}
        className="position-absolute top-0 end-0 m-2 z-1 bg-white border-0 rounded-circle shadow-sm d-flex align-items-center justify-content-center p-2"
        style={{ width: '36px', height: '36px', transition: 'transform 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isWishlist ? <FaHeart className="text-danger" size={18} /> : <FaRegHeart className="text-muted" size={18} />}
      </button>

      {/* Khung ảnh */}
      <div className="product-img-box position-relative overflow-hidden p-3" style={{ height: '230px' }}>
        <Link to={`/product/${card.id}`}>
          <Card.Img 
            src={card.image} 
            alt={card.name} 
            className="w-100 h-100 item-smooth-zoom" 
            style={{ objectFit: 'contain' }}
          />
        </Link>
        
        {/* NÚT QUICK VIEW HIỆN KHI HOVER (Hoặc định vị ẩn/hiện bằng CSS) */}
        <div className="quick-view-overlay position-absolute start-50 top-50 translate-middle w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-25 opacity-0 item-hover-show" style={{ transition: '0.3s' }}>
          <Button variant="light" size="sm" className="fw-bold shadow d-flex align-items-center gap-1 py-2 px-3" onClick={() => onQuickView(card)}>
            <FaEye /> Xem nhanh
          </Button>
        </div>
      </div>
      
      <Card.Body className="d-flex flex-column text-center bg-light pt-2">
        <Link to={`/product/${card.id}`} className="text-decoration-none text-dark hover-danger">
          <Card.Title className="fw-bold text-truncate mb-2" style={{ fontSize: '0.9rem' }} title={card.name}>
            {card.name}
          </Card.Title>
        </Link>
        
        {card.RarityData?.name && (
          <div className="mb-2">
            <span className="badge bg-warning text-dark px-2 py-0.5 fw-bold" style={{ fontSize: '0.65rem' }}>
              {card.RarityData.name}
            </span>
          </div>
        )}

        <Card.Text className="text-danger fw-bold mb-3">{Number(card.price).toLocaleString()}đ</Card.Text>
        
        <Button 
          className="tcg-btn mt-auto py-2 fw-bold w-100" 
          variant={card.countInStock > 0 ? "warning" : "secondary"}
          disabled={card.countInStock <= 0}
          onClick={() => addToCart(card)}
          style={{ fontSize: '0.8rem' }}
        >
          {card.countInStock > 0 ? "THÊM VÀO GIỎ" : "HẾT HÀNG"}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ProductCardItem;