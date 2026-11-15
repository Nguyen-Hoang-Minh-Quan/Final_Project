import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebook, FaInstagram, FaTiktok, FaYoutube, FaPhoneAlt } from 'react-icons/fa';
import '../../styles/TCGStyles.css';

const Footer = () => (
  <footer className="custom-footer pt-5 pb-3 mt-5">
    <Container>
      <Row className="mb-4 text-center border-bottom border-secondary pb-4">
        <Col md={3}>🚚 EXPRESS DELIVERY</Col>
        <Col md={3}>🎁 SPECIAL OFFERS</Col>
        <Col md={3}>✅ 100% AUTHENTIC</Col>
        <Col md={3}>📞 24/7 SUPPORT</Col>
      </Row>
      <Row>
        <Col md={4} className="mb-4">
          <h5 className="text-warning fw-bold mb-3">TCG SHOP</h5>
          <p className="text-secondary small">Specializing in authentic Pokémon trading cards and accessories in Vietnam.</p>
          <p className="small"><FaPhoneAlt className="me-2"/>Hotline: 0703192208</p>
          <p className="small">Email: mquantcv@gmail.com</p>
          <p className="small">Address: 55/45/36 Hoa Ha Street, Lien Dong Ward, Long Xuan City, Vietnam</p>
        </Col>
        <Col md={4} className="mb-4">
          <h6 className="fw-bold mb-3">Commitment</h6>
          <ul className="list-unstyled text-secondary small"> 
            <li>100% Authentic</li>
            <li>Say No to Reseal</li>
            <li>Door-to-Door Delivery</li>
          </ul>
        </Col>
        <Col md={4} className="mb-4 text-md-end">
          <h6 className="fw-bold mb-3">FOLLOW US</h6>
          <div className="d-flex gap-3 fs-3 justify-content-md-end">
            <a 
              href="https://www.facebook.com/alex.alon.347" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover-danger"
            >
              <FaFacebook />
            </a>
            <a 
              href="https://www.instagram.com/venti.09/?__pwa=1" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover-danger"
            >
              <FaInstagram />
            </a>
            <a 
              href="https://www.tiktok.com/@hsr_player_pokemontcg?is_from_webapp=1&sender_device=pc" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover-danger"
            >
              <FaTiktok />
            </a>
            <a 
              href="https://www.youtube.com/@QuanMinh-fc8ue " 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover-danger"
            >
              <FaYoutube />
            </a>
          </div>
        </Col>
      </Row>
    </Container>
  </footer>
);

export default Footer;