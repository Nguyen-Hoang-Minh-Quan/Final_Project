import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Carousel, Badge, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaFire, FaRegClock, FaLayerGroup } from 'react-icons/fa';
import axiosClient from '../../api/axiosClient'; 
import '../../styles/TCGStyles.css';

const CATEGORY_IMAGES = {
  "Single Cards": "https://assets.pokemon.com/static-assets/content-assets/cms2/img/cards/web/ME04/ME04_EN_91.png",
  "Elite Trainer Box": "https://www.pokemoncenter.com/images/DAMRoot/High/10035/P11220_10-10416-112_01.jpg",
  "Booster Box": "https://www.pokemoncenter.com/images/DAMRoot/High/10030/P11219_10-10407-119_02.jpg",
  "Sleeves Cards": "https://tcgplayer-cdn.tcgplayer.com/product/614504_in_1000x1000.jpg",
  "Pack": "https://www.pokemoncenter.com/images/DAMRoot/High/10030/P11219_10-10407-119_03.jpg",
  "Other accessories": "https://www.pokemoncenter.com/images/DAMRoot/High/10034/P11638_10-10626-101_02.jpg"
};

const DEFAULT_CATEGORY_IMAGE = "https://www.pokemoncenter.com/images/DAMRoot/High/10034/P11638_10-10626-101_02.jpg";

const Home = ({ customData }) => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (customData) {
          setCards(customData);
        } else {
          const { data } = await axiosClient.get('/products'); 
          setCards(data);
        }

        try {
          const catRes = await axiosClient.get('/products/categories');
          setCategories(catRes.data);
        } catch (catErr) {
          setCategories([
            { id: 1, name: 'Booster Box' },
            { id: 2, name: 'Elite Trainer Box' },
            { id: 3, name: 'Single Cards' },
            { id: 4, name: 'Other accessories' },
            { id: 5, name: 'Pack' },
            { id: 6, name: 'Sleeves Cards' },
          ]);
        }

        setLoading(false);
      } catch (error) {
        toast.error("Synchronized data system error!");
        console.error("Synchronized data system error:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [customData]);

  const addToCart = (card) => {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const existItem = cartItems.find(x => x.id === card.id);
    if (existItem) {
      if (existItem.qty < card.countInStock) {
        existItem.qty += 1;
      } else {
        return toast.error(`Product "${card.name}" in stock is not enough!`);
      }
    } else {
      cartItems.push({ ...card, qty: 1 });
    }
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    window.dispatchEvent(new Event("cartUpdated"));
    
    toast.success(`Product "${card.name}" added to cart! 🛒`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  const newArrivals = cards.slice(0, 4); 
  const bestSellers = cards.filter(c => c.countInStock > 0).slice(0, 4); 

  return (
    <div className="home-page-container">
      {!customData && (
        <Carousel fade className="mb-5 shadow-sm">
          <Carousel.Item style={{ height: '420px' }}>
            <img
              className="d-block w-100 h-100"
              src="https://www.dexerto.com/cdn-image/wp-content/uploads/2025/09/03/Pokemon-TCG-Phantasmal-Flame-charizard.jpg?width=1200&quality=60&format=auto"
              alt="Pokemon TCG Banner"
              style={{ objectFit: 'cover', filter: 'brightness(65%)' }}
            />
            <Carousel.Caption className="text-start pb-5">
              <Badge bg="danger" className="mb-2 text-uppercase p-2 fw-bold">Hot Release</Badge>
              <h1 className="fw-bold display-4 text-white">PHANTASMAL FLAMES</h1>
              <p className="fs-5 text-light">Get your hands on top-tier, highly sought-after cards with SR and SAR rarities at TCG SHOP!</p>
              <Button variant="danger" className="fw-bold px-4 py-2" onClick={() => navigate('/shop')}>
                DISCOVER NOW
              </Button>
            </Carousel.Caption>
          </Carousel.Item>

          <Carousel.Item style={{ height: '420px' }}>
            <img
              className="d-block w-100 h-100"
              src="https://www.pokemoncenter.com/images/DAMRoot/High/10030/P11219_10-10407-119_02.jpg"
              alt="Booster Box Banner"
              style={{ objectFit: 'cover', filter: 'brightness(60%)' }}
            />
            <Carousel.Caption className="text-start pb-5">
              <Badge bg="warning" className="mb-2 text-dark text-uppercase p-2 fw-bold">Pre-Order</Badge>
              <h1 className="fw-bold display-4 text-white">AUTHENTIC BOOSTER BOX</h1>
              <p className="fs-5 text-light">Say no to reseal. Ensure original factory seals reach your hands.</p>
              <Button variant="light" className="fw-bold text-danger px-4 py-2" onClick={() => navigate('/shop')}>
                VIEW MORE
              </Button>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      )}

      <Container className="main-layout pt-0">
        {!customData && (
          <div className="mb-5 bg-white p-4 rounded shadow-sm">
            <div className="border-bottom pb-2 mb-4">
              <h3 className="m-0 fw-bold fs-5 text-dark text-uppercase d-flex align-items-center">
                <FaLayerGroup className="me-2 text-warning" /> Product Categories
              </h3>
            </div>
            <Row className="g-3 justify-content-center">
              {categories.map((cat) => {
                const categoryImageUrl = CATEGORY_IMAGES[cat.name] || DEFAULT_CATEGORY_IMAGE;

                return (
                  <Col xs={6} md={3} key={cat.id}>
                    <div 
                      className="category-box text-center p-3 border rounded h-100 d-flex flex-column align-items-center justify-content-center"
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                      onClick={() => navigate(`/shop?categoryId=${cat.id}`)}
                    >
                      <div className="category-img-wrapper mb-3 overflow-hidden d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                        <img 
                          src={categoryImageUrl} 
                          alt={cat.name} 
                          className="w-100 h-100 object-fit-contain" 
                          style={{ transition: 'transform 0.3s' }}
                        />
                      </div>
                      <h5 className="category-title fw-bold m-0" style={{ fontSize: '0.9rem', color: '#333' }}>{cat.name}</h5>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}

        {customData ? (
          <>
            <h2 className="section-title border-bottom pb-2 mb-4 text-uppercase fw-bold fs-4">
              🔍 Search Results ({cards.length})
            </h2>
            <Row>
              {cards.map(card => (
                <Col md={3} sm={6} key={card.id} className="mb-4">
                  <ProductCardItem card={card} addToCart={addToCart} />
                </Col>
              ))}
            </Row>
          </>
        ) : (
          <>
            <div className="mb-5">
              <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h3 className="m-0 fw-bold fs-4 text-dark text-uppercase">
                  <FaRegClock className="me-2 text-primary" /> Latest products
                </h3>
                <Link to="/shop" className="text-decoration-none text-muted small fw-bold hover-danger">View All</Link>
              </div>
              <Row>
                {newArrivals.map(card => (
                  <Col md={3} sm={6} key={card.id} className="mb-4">
                    <ProductCardItem card={card} addToCart={addToCart} isNew={true} />
                  </Col>
                ))}
              </Row>
            </div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h3 className="m-0 fw-bold fs-4 text-dark text-uppercase">
                  <FaFire className="me-2 text-danger" /> Best Selling Products
                </h3>
                <Link to="/shop" className="text-decoration-none text-muted small fw-bold hover-danger">View All</Link>
              </div>
              <Row>
                {bestSellers.map(card => (
                  <Col md={3} sm={6} key={card.id} className="mb-4">
                    <ProductCardItem card={card} addToCart={addToCart} isHot={true} />
                  </Col>
                ))}
              </Row>
            </div>
          </>
        )}
      </Container>
    </div>
  );
};

const ProductCardItem = ({ card, addToCart, isNew, isHot }) => {
  return (
    <Card className="tcg-card h-100 shadow-sm border-0 position-relative overflow-hidden">
      {isNew && card.countInStock > 0 && <Badge bg="primary" className="position-absolute top-0 start-0 m-2 z-1">NEW</Badge>}
      {isHot && card.countInStock > 0 && <Badge bg="danger" className="position-absolute top-0 start-0 m-2 z-1">HOT</Badge>}
      {card.countInStock <= 0 && <Badge bg="secondary" className="position-absolute top-0 start-0 m-2 z-1">OUT OF STOCK</Badge>}

      <Link to={`/product/${card.id}`} className="text-decoration-none">
        <div className="product-img-box position-relative overflow-hidden p-3" style={{ cursor: 'pointer', height: '240px' }}>
          <Card.Img 
            src={card.image} 
            alt={card.name} 
            className="w-100 h-100 item-smooth-zoom" 
            style={{ objectFit: 'contain' }}
          />
        </div>
      </Link>
      
      <Card.Body className="d-flex flex-column text-center bg-light pt-2">
        <Link to={`/product/${card.id}`} className="text-decoration-none text-dark hover-danger">
          <Card.Title className="fw-bold text-truncate mb-2" style={{ fontSize: '0.95rem', cursor: 'pointer' }} title={card.name}>
            {card.name}
          </Card.Title>
        </Link>
        
        {card.RarityData?.name && (
          <div className="mb-2">
            <span className="badge bg-warning text-dark px-2 py-0.5 fw-bold" style={{ fontSize: '0.7rem' }}>
              {card.RarityData.name}
            </span>
          </div>
        )}

        <Card.Text className="text-danger fw-bold fs-5 mb-3">{Number(card.price).toLocaleString()}đ</Card.Text>
        
        <Button 
          className="tcg-btn mt-auto py-2 fw-bold w-100" 
          variant={card.countInStock > 0 ? "warning" : "secondary"}
          disabled={card.countInStock <= 0}
          onClick={() => addToCart(card)}
          style={{ fontSize: '0.85rem' }}
        >
          {card.countInStock > 0 ? "ADD TO CART" : "OUT OF STOCK"}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default Home;