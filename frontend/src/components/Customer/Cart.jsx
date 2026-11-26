import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineTrash, HiOutlinePlus, HiOutlineMinus } from 'react-icons/hi2';
import '../../styles/TCGStyles.css';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    setCartItems(JSON.parse(localStorage.getItem('cartItems')) || []);
  }, []);

  const updateQty = (id, newQty, stock) => {
    if (newQty < 1 || newQty > stock) return;
    // ĐỒNG BỘ: Chuyển hoàn toàn item._id sang item.id
    const newCart = cartItems.map(item => item.id === id ? { ...item, qty: newQty } : item);
    saveCart(newCart);
  };

  const removeItem = (id) => saveCart(cartItems.filter(item => item.id !== id));

  const saveCart = (data) => {
    setCartItems(data);
    localStorage.setItem('cartItems', JSON.stringify(data));
    const uInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (uInfo && uInfo.id) {
      localStorage.setItem(`cartItems_${uInfo.id}`, JSON.stringify(data));
    }
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const total = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  return (
    <Container className="main-layout">
      <h2 className="section-title">CART</h2>
      {cartItems.length === 0 ? (
        <Card className="tcg-card p-5 text-center shadow-sm">
          <p className="fs-5">Your cart is empty!</p>
          <Button as={Link} to="/" variant="danger" className="tcg-btn mx-auto w-25">SHOP NOW</Button>
        </Card>
      ) : (
        <Row>
          <Col lg={8}>
            <Table responsive className="tcg-card bg-white shadow-sm align-middle">
              <thead className="bg-dark text-white">
                <tr><th>Product</th><th className="text-center">Quantity</th><th className="text-end">Price</th><th></th></tr>
              </thead>
              <tbody>
                {cartItems.map(item => (
                  // ĐỒNG BỘ: key={item.id}
                  <tr key={item.id}>
                    <td>
                      <img 
                        src={item.image} 
                        className="cart-product-img" 
                        alt={item.name} 
                      />
                      <div className="d-inline-block align-middle ms-2">
                        <span className="fw-bold d-block">{item.name}</span>
                        {item.RarityData?.name && (
                          <small className="text-muted">Rarity: {item.RarityData.name}</small>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      <Button variant="light" size="sm" onClick={() => updateQty(item.id, item.qty - 1, item.countInStock)}><HiOutlineMinus/></Button>
                      <b className="mx-2">{item.qty}</b>
                      <Button variant="light" size="sm" onClick={() => updateQty(item.id, item.qty + 1, item.countInStock)}><HiOutlinePlus/></Button>
                    </td>
                    <td className="text-end fw-bold text-danger">{(item.price * item.qty).toLocaleString()}đ</td>
                    <td className="text-center"><Button variant="link" className="text-danger" onClick={() => removeItem(item.id)}><HiOutlineTrash/></Button></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
          <Col lg={4}>
            <Card className="tcg-card p-4 shadow-sm">
              <h5 className="fw-bold mb-4">CHECKOUT</h5>
              <div className="d-flex justify-content-between mb-4 fs-5">
                <span>Total:</span><span className="text-danger fw-bold">{total.toLocaleString()}đ</span>
              </div>
              <Button className="tcg-btn w-100" variant="danger" onClick={() => navigate(userInfo ? '/checkout' : '/login')}>
                {userInfo ? "PROCEED TO CHECKOUT" : "LOGIN TO PURCHASE"}
              </Button>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};
export default Cart;