import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Form, FormControl, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUserShield, FaHistory, FaUserCircle, FaSignOutAlt, FaSearch, FaShoppingCart, FaHeart, FaUserCog } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../../styles/TCGStyles.css';

const Header = () => {
  const [keyword, setKeyword] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const updateStatus = () => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    setCartCount(cartItems.reduce((acc, item) => acc + Number(item.qty), 0));

    const wishlistItems = JSON.parse(localStorage.getItem('wishlistItems')) || [];
    setWishlistCount(wishlistItems.length);
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    setUser(userInfo);
  };

  useEffect(() => {
    updateStatus();
    window.addEventListener('cartUpdated', updateStatus);
    window.addEventListener('wishlistUpdated', updateStatus);
    return () => {
      window.removeEventListener('cartUpdated', updateStatus);
      window.removeEventListener('wishlistUpdated', updateStatus);
    };
  }, [location]);

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
    toast.warn("Logged out of the account!");
    navigate('/login');
  };

  // Xác định vai trò của người dùng
  const userRole = user?.role || (user?.isAdmin ? 'Admin' : 'Customer');
  const isStaffOrAdmin = userRole === 'Admin' || userRole === 'Staff' || user?.isAdmin;

  return (
    <Navbar expand="lg" className="custom-header sticky-top py-2">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-danger fs-3">TCG SHOP</Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto ms-lg-4">
            <Nav.Link as={Link} to="/" className="fw-bold text-uppercase">Home</Nav.Link>
            <Nav.Link as={Link} to="/shop" className="fw-bold text-uppercase">Products</Nav.Link>
            <Nav.Link as={Link} to="/blogs" className="fw-bold text-uppercase">News</Nav.Link>
          </Nav>

          {/* Thanh tìm kiếm */}
          <Form onSubmit={submitHandler} className="d-flex me-3">
            <FormControl 
              type="text" 
              placeholder="Search cards..." 
              className="tcg-input me-2" 
              onChange={(e) => setKeyword(e.target.value)} 
            />
            <Button type="submit" variant="danger" className="tcg-btn">
              <FaSearch />
            </Button>
          </Form>

          <Nav className="align-items-center">
            {/* Chỉ hiển thị Yêu thích & Giỏ hàng cho Khách hàng */}
            {!isStaffOrAdmin && (
              <>
                <Nav.Link as={Link} to="/wishlist" className="position-relative me-3">
                  <FaHeart className="fs-4 text-danger" />
                  {wishlistCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark fw-bold">
                      {wishlistCount}
                    </span>
                  )}
                </Nav.Link>
                <Nav.Link as={Link} to="/cart" className="position-relative me-3">
                  <FaShoppingCart className="fs-4 text-light" />
                  {cartCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {cartCount}
                    </span>
                  )}
                </Nav.Link>
              </>
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
                  <FaUserCircle className="me-2 text-primary"/>Profile
                </NavDropdown.Item>

                {/* KIỂM TRA QUYỀN ADMIN / STAFF ĐỂ HIỆN NÚT TRUY CẬP TRANG QUẢN TRỊ */}
                {isStaffOrAdmin ? (
                  <NavDropdown.Item as={Link} to="/admin" className="fw-bold text-danger">
                    {userRole === 'Staff' ? (
                      <><FaUserCog className="me-2 text-warning"/>Staff Dashboard</>
                    ) : (
                      <><FaUserShield className="me-2 text-danger"/>System Administration</>
                    )}
                  </NavDropdown.Item>
                ) : (
                  <NavDropdown.Item as={Link} to="/order-history">
                    <FaHistory className="me-2 text-success"/>Order History
                  </NavDropdown.Item>
                )}

                <NavDropdown.Divider />
                
                <NavDropdown.Item onClick={logoutHandler} className="text-danger">
                  <FaSignOutAlt className="me-2"/>Log Out
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Button as={Link} to="/login" variant="outline-danger" className="tcg-btn">
                Log In
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;