import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Card, ListGroup, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { FaTruck, FaQrcode, FaCreditCard, FaTicketAlt } from 'react-icons/fa';
import CheckoutAddressSection from './CheckoutAddressSection';
import '../../styles/TCGStyles.css';

const Checkout = () => {
    const navigate = useNavigate();
    
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // State lưu địa chỉ được lựa chọn từ sổ địa chỉ
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [method, setMethod] = useState('COD');
    const [error, setError] = useState(null);

    // State phục vụ cho tính năng Giftcode tương lai
    const [couponCode, setCouponCode] = useState('');

    const total = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

    // Kiểm tra quyền truy cập hợp lệ
    useEffect(() => {
        if (!userInfo) {
            navigate('/login?redirect=checkout');
        } else if (cartItems.length === 0) {
            navigate('/cart');
        }
    }, [userInfo, navigate, cartItems.length]);

    const handleApplyCoupon = (e) => {
        e.preventDefault();
        if (!couponCode.trim()) return;
        alert(`Coupon code "${couponCode.toUpperCase()}" will be integrated for processing at a later stage!`);
    };

    // Hàm nhận dữ liệu địa chỉ được click chọn từ component con
    const handleAddressSelect = (addr) => {
        setSelectedAddress(addr);
    };

    const placeOrder = async () => {
        if (!selectedAddress || !selectedAddress.details || !selectedAddress.phone) {
            return setError("Please add a delivery address or select one from your address book!");
        }

        try {
        const orderData = {
            orderItems: cartItems.map(item => ({
                productId: item.id, 
                qty: item.qty
            })),
            address: selectedAddress.details, // Sửa từ addressDetails -> details thành công!
            city: "Vietnam", 
            phone: selectedAddress.phone,
            paymentMethod: method,
            coupon: couponCode || null,
            status: 0
        };

            await axiosClient.post('/orders', orderData);

            localStorage.removeItem('cartItems');
            window.dispatchEvent(new Event("cartUpdated"));

            alert("Order placed successfully! 🎉");
            navigate('/order-history');
        } catch (err) {
            console.error("Error placing order:", err);
            setError(err.response?.data?.message || "Server is not responding, please try again later!");
        }
    };

    return (
        <Container className="main-layout py-5">
            <h2 className="section-title text-uppercase mb-4">
                <FaTruck className="me-2 text-danger"/> Checkout
            </h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                <Col md={7}>
                    {/* 1. TÍCH HỢP KHỐI CHỌN NHIỀU ĐỊA CHỈ THAY THẾ CHO THÀNH PHẦN INPUT CŨ */}
                    <CheckoutAddressSection onAddressSelect={handleAddressSelect} />

                    <Card className="tcg-card p-4 mb-4 border-0 shadow-sm">
                        <Row>
                            {/* Khối nhập mã giảm giá tinh chỉnh hạ xuống dưới */}
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">COUPON CODE / GIFTCODE (IF ANY)</Form.Label>
                                    <div className="d-flex gap-2">
                                        <Form.Control 
                                            className="tcg-input mb-0" 
                                            placeholder="E.g.: TCGSHOP50"
                                            value={couponCode}
                                            onChange={e => setCouponCode(e.target.value)}
                                        />
                                        <Button 
                                            variant="dark" 
                                            className="px-3 fw-bold small text-nowrap"
                                            onClick={handleApplyCoupon}
                                            style={{ borderRadius: '6px', fontSize: '13px' }}
                                        >
                                            APPLY
                                        </Button>
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>

                        <h5 className="fw-bold mt-4 mb-3">
                            <FaCreditCard className="me-2 text-warning"/> PAYMENT METHOD
                        </h5>
                        <div className="bg-light p-3 rounded">
                            {['COD', 'Momo' , 'Ngân hàng'].map(m => (
                                <Form.Check 
                                    key={m} 
                                    type="radio" 
                                    label={m === 'COD' ? "Pay when receiving (COD)" : m === 'Momo' ? "Pay via Momo" : "Pay via Bank Transfer"} 
                                    name="method" 
                                    id={`method-${m}`}
                                    checked={method === m} 
                                    onChange={() => setMethod(m)} 
                                    className="fw-bold mb-2 cursor-pointer"
                                />
                            ))}
                        </div>

                        {method === 'Momo' && (
                            <div className="text-center bg-white p-3 rounded mt-3 border border-danger shadow-sm">
                                <h6 className="fw-bold text-danger"><FaQrcode className="me-2"/>SCAN MOMO QR CODE</h6>
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=PAY_ORDER_${total}`} 
                                    alt="QR Code Payment" 
                                    className="img-fluid border p-2 bg-white my-2" 
                                />
                                <p className="small text-muted mb-0">Please scan the code to complete the payment</p>
                            </div>
                        )}

                        {method === 'Ngân hàng' && (
                            <div className="text-center bg-white p-3 rounded mt-3 border border-danger shadow-sm">
                                <h6 className="fw-bold text-danger"><FaCreditCard className="me-2"/>PAYMENT INFORMATION</h6>
                                <img 
                                    src={`https://img.vietqr.io/image/vcb-777666999-compact2.jpg?amount=${total}&addInfo=THANH_TOAN_DON_HANG`} 
                                    alt="Vietcombank QR Code"
                                    className="img-fluid mb-2" 
                                /> 
                            </div>
                        )}

                        <Button 
                            className="tcg-btn w-100 mt-4 py-3 fw-bold fs-5" 
                            variant="danger" 
                            onClick={placeOrder}
                        >
                            CONFIRM ORDER
                        </Button>
                    </Card>
                </Col>

                <Col md={5}>
                    <Card className="tcg-card p-3 shadow-sm border-0 sticky-top" style={{ top: '100px' }}>
                        <h5 className="fw-bold mb-3">ORDER SUMMARY ({cartItems.length})</h5>
                        <ListGroup variant="flush">
                            {cartItems.map((item, idx) => (
                                <ListGroup.Item key={idx} className="d-flex justify-content-between px-0 bg-transparent">
                                    <div className="d-flex align-items-center">
                                        <img 
                                            src={item.image} 
                                            className="thumbnail-img rounded me-3" 
                                            alt={item.name} 
                                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                        />
                                        <div>
                                            <div className="small fw-bold text-truncate" style={{maxWidth: '180px'}}>{item.name}</div>
                                            <div className="small text-muted">Quantity: {item.qty}</div>
                                        </div>
                                    </div>
                                    <span className="fw-bold">{(item.qty * item.price).toLocaleString()}đ</span>
                                </ListGroup.Item>
                            ))}
                            
                            <div className="border-top mt-3 pt-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Subtotal:</span>
                                    <span>{total.toLocaleString()}đ</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Shipping Fee:</span>
                                    <span className="text-success fw-bold">Free</span>
                                </div>
                                
                                {couponCode && (
                                    <div className="d-flex justify-content-between mb-2 text-success fw-bold small">
                                        <span> Discount Code:</span>
                                        <span>-0đ</span>
                                    </div>
                                )}

                                <div className="d-flex justify-content-between fw-bold fs-4 text-danger mt-2">
                                    <span>TOTAL:</span>
                                    <span>{total.toLocaleString()}đ</span>
                                </div>
                            </div>
                        </ListGroup>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Checkout;