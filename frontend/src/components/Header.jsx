import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Form, FormControl, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUserShield, FaHistory, FaUserCircle, FaSignOutAlt, FaSearch, FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/TCGStyles.css';

const Header = () => {
  const [keyword, setKeyword] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const updateStatus = () => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    setCartCount(cartItems.reduce((acc, item) => acc + Number(item.qty), 0));
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    setUser(userInfo);
  };

  useEffect(() => {
    updateStatus();
    window.addEventListener('cartUpdated', updateStatus);
    return () => window.removeEventListener('cartUpdated', updateStatus);
  }, [location]);

  // 🌟 ĐÃ SỬA: Hàm gửi từ khóa tìm kiếm trực tiếp qua trang Shop bằng Query Parameter
  const submitHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/shop?keyword=${encodeURIComponent(keyword.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    toast.warn("Đã đăng xuất khỏi tài khoản!");
    navigate('/login');
  };

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm sticky-top py-2">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-danger fs-3">TCG SHOP</Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto ms-lg-4">
            <Nav.Link as={Link} to="/" className="fw-bold text-uppercase">Trang chủ</Nav.Link>
            <Nav.Link as={Link} to="/shop" className="fw-bold text-uppercase">Sản phẩm</Nav.Link>
          </Nav>

          {/* Thanh tìm kiếm */}
          <Form onSubmit={submitHandler} className="d-flex me-3">
            <FormControl 
              type="text" 
              placeholder="Tìm thẻ bài..." 
              className="tcg-input me-2" 
              onChange={(e) => setKeyword(e.target.value)} 
            />
            <Button type="submit" variant="danger" className="tcg-btn">
              <FaSearch />
            </Button>
          </Form>

          <Nav className="align-items-center">
            {(!user || !user.isAdmin) && (
              <Nav.Link as={Link} to="/cart" className="position-relative me-3">
                <FaShoppingCart className="fs-4 text-dark" />
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {cartCount}
                  </span>
                )}
              </Nav.Link>
            )}

            {user ? (
              <NavDropdown 
                title={
                  <span className="fw-bold text-danger">
                    <FaUserCircle className="me-1"/>{user.name}
                  </span>
                } 
              >
                <NavDropdown.Item as={Link} to="/profile">
                  <FaUserCircle className="me-2 text-primary"/>Hồ sơ cá nhân
                </NavDropdown.Item>
                 
                {user.isAdmin ? (
                  <NavDropdown.Item as={Link} to="/admin">
                    <FaUserShield className="me-2 text-primary"/>Quản trị hệ thống
                  </NavDropdown.Item>
                ) : (
                  <NavDropdown.Item as={Link} to="/order-history">
                    <FaHistory className="me-2 text-success"/>Lịch sử đơn hàng
                  </NavDropdown.Item>
                )}

                <NavDropdown.Divider />
                
                <NavDropdown.Item onClick={logoutHandler} className="text-danger">
                  <FaSignOutAlt className="me-2"/>Đăng xuất
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Button as={Link} to="/login" variant="outline-danger" className="tcg-btn">
                ĐĂNG NHẬP
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;