import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Card, ListGroup, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTruck, FaQrcode, FaCreditCard, FaMapMarkerAlt } from 'react-icons/fa';
import '../styles/TCGStyles.css';

const Checkout = () => {
    const navigate = useNavigate();
    
    // Khởi tạo dữ liệu từ LocalStorage
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // State quản lý thông tin giao hàng và lỗi
    const [shipping, setShipping] = useState({ 
        address: '', 
        city: '', 
        phone: '' 
    });
    const [method, setMethod] = useState('COD');
    const [error, setError] = useState(null);

    // Tính tổng tiền
    const total = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

    // Kiểm tra nếu giỏ hàng trống hoặc chưa đăng nhập thì đẩy về trang tương ứng
    useEffect(() => {
        if (!userInfo) {
            navigate('/login?redirect=checkout');
        }
        if (cartItems.length === 0) {
            navigate('/cart');
        }
    }, [userInfo, navigate, cartItems.length]);

    const placeOrder = async () => {
        // Kiểm tra validation cơ bản trước khi gửi
        if (!shipping.address || !shipping.phone) {
            return setError("Vui lòng nhập đầy đủ địa chỉ và số điện thoại giao hàng!");
        }

        try {
            // Cấu hình Header với Token để vượt qua middleware 'protect' ở Backend
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            // Chuẩn bị object dữ liệu gửi lên (Body)
            const orderData = {
                orderItems: cartItems.map(item => ({
                    name: item.name,
                    qty: item.qty,
                    image: item.image,
                    price: item.price,
                    product: item._id // Đảm bảo field này là ID sản phẩm để Backend trừ kho
                })),
                address: shipping.address,
                city: shipping.city || "Vietnam",
                phone: shipping.phone,
                paymentMethod: method,
                totalPrice: total
            };

            // Gửi request POST đến Backend
            await axios.post('http://localhost:5000/api/orders', orderData, config);

            // Xóa giỏ hàng sau khi đặt thành công
            localStorage.removeItem('cartItems');
            
            // Thông báo cho Header cập nhật lại số lượng giỏ hàng (nếu Quân có dùng event này)
            window.dispatchEvent(new Event("cartUpdated"));

            // Chuyển hướng về trang lịch sử đơn hàng
            navigate('/order-history');
        } catch (err) {
            console.error("Lỗi đặt hàng:", err);
            setError(err.response?.data?.message || "Máy chủ không phản hồi, vui lòng thử lại sau!");
        }
    };

    return (
        <Container className="main-layout py-5">
            <h2 className="section-title text-uppercase mb-4">
                <FaTruck className="me-2 text-danger"/> Thanh toán đơn hàng
            </h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                {/* CỘT TRÁI: THÔNG TIN GIAO HÀNG */}
                <Col md={7}>
                    <Card className="tcg-card p-4 mb-4 border-0 shadow-sm">
                        <h5 className="fw-bold mb-4 border-bottom pb-2">
                            <FaMapMarkerAlt className="me-2 text-primary"/> THÔNG TIN GIAO HÀNG
                        </h5>
                        
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold">ĐỊA CHỈ NHẬN HÀNG</Form.Label>
                            <Form.Control 
                                className="tcg-input" 
                                placeholder="Số nhà, tên đường, phường/xã..." 
                                value={shipping.address}
                                onChange={e => setShipping({...shipping, address: e.target.value})} 
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">SỐ ĐIỆN THOẠI</Form.Label>
                                    <Form.Control 
                                        className="tcg-input" 
                                        placeholder="Nhập số điện thoại..."
                                        value={shipping.phone}
                                        onChange={e => setShipping({...shipping, phone: e.target.value})} 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">TỈNH / THÀNH PHỐ</Form.Label>
                                    <Form.Control 
                                        className="tcg-input" 
                                        placeholder="Nhập tỉnh thành..."
                                        value={shipping.city}
                                        onChange={e => setShipping({...shipping, city: e.target.value})} 
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <h5 className="fw-bold mt-4 mb-3">
                            <FaCreditCard className="me-2 text-warning"/> PHƯƠNG THỨC THANH TOÁN
                        </h5>
                        <div className="bg-light p-3 rounded">
                            {['COD', 'Momo' , 'Ngân hàng'].map(m => (
                                <Form.Check 
                                    key={m} 
                                    type="radio" 
                                    label={m === 'COD' ? "Thanh toán khi nhận hàng (COD)" : m === 'Momo' ? "Thanh toán qua Momo" : "Thanh toán qua Ngân hàng"} 
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
                                <h6 className="fw-bold text-danger"><FaQrcode className="me-2"/>QUÉT MÃ QR MOMO</h6>
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=PAY_ORDER_${total}`} 
                                    alt="QR Code Payment" 
                                    className="img-fluid border p-2 bg-white my-2" 
                                />
                                <p className="small text-muted mb-0">Vui lòng quét mã để thanh toán đơn hàng</p>
                            </div>
                        )}

                        {method === 'Ngân hàng' && (
                            <div className="text-center bg-white p-3 rounded mt-3 border border-danger shadow-sm">
                                <h6 className="fw-bold text-danger"><FaCreditCard className="me-2"/>THÔNG TIN THANH TOÁN</h6>
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
                            XÁC NHẬN ĐẶT HÀNG
                        </Button>
                    </Card>
                </Col>

                {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
                <Col md={5}>
                    <Card className="tcg-card p-3 shadow-sm border-0 sticky-top" style={{ top: '100px' }}>
                        <h5 className="fw-bold mb-3">TÓM TẮT ĐƠN HÀNG ({cartItems.length})</h5>
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
                                            <div className="small text-muted">Số lượng: {item.qty}</div>
                                        </div>
                                    </div>
                                    <span className="fw-bold">{(item.qty * item.price).toLocaleString()}đ</span>
                                </ListGroup.Item>
                            ))}
                            
                            <div className="border-top mt-3 pt-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Tạm tính:</span>
                                    <span>{total.toLocaleString()}đ</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Phí vận chuyển:</span>
                                    <span className="text-success fw-bold">Miễn phí</span>
                                </div>
                                <div className="d-flex justify-content-between fw-bold fs-4 text-danger mt-2">
                                    <span>TỔNG CỘNG:</span>
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