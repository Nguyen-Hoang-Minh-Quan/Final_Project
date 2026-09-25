import React from 'react';
import { Modal, Row, Col, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaShoppingBag, FaEye } from 'react-icons/fa';

const QuickViewModal = ({ show, handleClose, product, addToCart }) => {
  if (!product) return null;

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-0"></Modal.Header>
      <Modal.Body className="pt-0">
        <Row>
          <Col md={5} className="text-center mb-3 mb-md-0">
            <img 
              src={product.image} 
              alt={product.name} 
              style={{ maxHeight: '320px', maxWidth: '100%', objectFit: 'contain' }}
            />
          </Col>
          <Col md={7} className="d-flex flex-column justify-content-between">
            <div>
              <h4 className="fw-bold text-dark mb-2">{product.name}</h4>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge bg="primary">{product.gameType}</Badge>
                {product.CategoryData?.name && <Badge bg="secondary">{product.CategoryData.name}</Badge>}
                {product.RarityData?.name && <Badge bg="warning" text="dark">Rarity: {product.RarityData.name}</Badge>}
              </div>
              <h3 className="text-danger fw-bold mb-3">{Number(product.price).toLocaleString()}đ</h3>
              <p className="text-muted small mb-4" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {product.description || "Sản phẩm này chưa có bài viết mô tả chi tiết."}
              </p>
            </div>
            
            <div className="d-flex gap-2">
              <Button 
                className="tcg-btn flex-grow-1 py-2 fw-bold" 
                variant={product.countInStock > 0 ? "warning" : "secondary"}
                disabled={product.countInStock <= 0}
                onClick={() => {
                  addToCart(product);
                  handleClose();
                }}
              >
                <FaShoppingBag className="me-2" /> Thêm vào giỏ
              </Button>
              <Button as={Link} to={`/product/${product.id}`} variant="outline-danger" className="fw-bold" onClick={handleClose}>
                <FaEye className="me-1"/> Chi tiết
              </Button>
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default QuickViewModal;