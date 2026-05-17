import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import axios from 'axios';
import '../styles/TCGStyles.css';

const Home = ({ customData }) => {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    if (customData) {
      setCards(customData);
    } else {
      const fetchCards = async () => {
        const { data } = await axios.get('http://localhost:5000/api/cards');
        setCards(data);
      };
      fetchCards();
    }
  }, [customData]);

  const addToCart = (card) => {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const existItem = cartItems.find(x => x._id === card._id);
    if (existItem) {
      if (existItem.qty < card.countInStock) existItem.qty += 1;
      else return alert("Hết hàng!");
    } else {
      cartItems.push({ ...card, qty: 1 });
    }
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  return (
    <Container className="main-layout">
      <h2 className="section-title">{customData ? "Kết quả tìm kiếm" : "Thẻ bài mới nhất"}</h2>
      <Row>
        {cards.map(card => (
          <Col md={3} sm={6} key={card._id} className="mb-4">
            <Card className="tcg-card h-100">
              <div className="product-img-box">
                <Card.Img src={card.image} alt={card.name} />
              </div>
              <Card.Body className="d-flex flex-column text-center bg-light">
                <Card.Title className="fw-bold text-truncate">{card.name}</Card.Title>
                <Card.Text className="text-danger fw-bold fs-5">{card.price.toLocaleString()}đ</Card.Text>
                <Button 
                  className="tcg-btn mt-auto" 
                  variant={card.countInStock > 0 ? "warning" : "secondary"}
                  disabled={card.countInStock <= 0}
                  onClick={() => addToCart(card)}
                >
                  {card.countInStock > 0 ? "THÊM VÀO GIỎ" : "HẾT HÀNG"}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};
export default Home;