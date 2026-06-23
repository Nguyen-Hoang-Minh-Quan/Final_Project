import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebook, FaInstagram, FaTiktok, FaYoutube, FaPhoneAlt } from 'react-icons/fa';
import '../styles/TCGStyles.css';

const Footer = () => (
  <footer className="bg-dark text-white pt-5 pb-3 mt-5">
    <Container>
      <Row className="mb-4 text-center border-bottom border-secondary pb-4">
        <Col md={3}>🚚 GIAO HÀNG SIÊU TỐC</Col>
        <Col md={3}>🎁 ƯU ĐÃI HẤP DẪN</Col>
        <Col md={3}>✅ CHÍNH HÃNG 100%</Col>
        <Col md={3}>📞 HỖ TRỢ 24/7</Col>
      </Row>
      <Row>
        <Col md={4} className="mb-4">
          <h5 className="text-warning fw-bold mb-3">TCG SHOP</h5>
          <p className="text-secondary small">Chuyên thẻ bài Pokémon và phụ kiện chính hãng tại Việt Nam.</p>
          <p className="small"><FaPhoneAlt className="me-2"/>Hotline: 0703192208</p>
          <p className="small">Email: mquantcv@gmail.com</p>
          <p className="small">Địa chỉ: 55/45/36 Đường Hoa Hạ, Phường Liên Đông, Thành phố Long Xuân Kình Thu</p>
        </Col>
        <Col md={4} className="mb-4">
          <h6 className="fw-bold mb-3">Cam kết</h6>
          <ul className="list-unstyled text-secondary smalel">
            <li>Chính hãng 100%</li>
            <li>Nói không với reseal</li>
            <li>Hàng giao tận tay</li>
          </ul>
        </Col>
        <Col md={4} className="mb-4 text-md-end">
          <h6 className="fw-bold mb-3">THEO DÕI CHÚNG TÔI</h6>
          <div className="d-flex gap-3 fs-3 justify-content-md-end">
            <FaFacebook className="text-primary" /><FaInstagram className="text-danger" /><FaTiktok /><FaYoutube className="text-danger" />
          </div>
        </Col>
      </Row>
    </Container>
  </footer>
);
export default Footer;