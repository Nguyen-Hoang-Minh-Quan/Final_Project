import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Card, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { FaPlus, FaTrash, FaEdit, FaBox } from 'react-icons/fa';
import '../styles/TCGStyles.css';

const AdminProductList = () => {
  const [products, setProducts] = useState([]);
  const [show, setShow] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [form, setForm] = useState({ name: '', price: 0, image: '', countInStock: 0 });

  const getProducts = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/cards');
      setProducts(data);
    } catch (err) { console.error("Lỗi tải dữ liệu"); }
  };

  useEffect(() => { getProducts(); }, []);

  // Mở modal để thêm mới
  const handleAdd = () => {
    setIsEdit(false);
    setForm({ name: '', price: 0, image: '', countInStock: 0 });
    setShow(true);
  };

  // Mở modal để sửa
  const handleEdit = (product) => {
    setIsEdit(true);
    setCurrentId(product._id);
    setForm({
      name: product.name,
      price: product.price,
      image: product.image,
      countInStock: product.countInStock
    });
    setShow(true);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        // Gọi API cập nhật (PUT) - Khớp với route /:id của bạn
        await axios.put(`http://localhost:5000/api/cards/${currentId}`, form);
      } else {
        // Gọi API thêm mới (POST)
        await axios.post('http://localhost:5000/api/cards', form);
      }
      setShow(false);
      getProducts();
    } catch (err) {
      alert("Có lỗi xảy ra khi lưu!");
    }
  };

  return (
    <Container className="main-layout">
      <Card className="border-0 shadow-sm p-4">
        <Row className="align-items-center mb-4">
          <Col>
            <h2 className="fw-bold mb-0"><FaBox className="text-danger me-2"/>KHO SẢN PHẨM</h2>
          </Col>
          <Col className="text-end">
            <Button className="tcg-btn px-4" variant="danger" onClick={handleAdd}>
              <FaPlus className="me-2"/> THÊM SẢN PHẨM MỚI
            </Button>
          </Col>
        </Row>

        <Table responsive hover className="admin-table border-top">
          <thead>
            <tr>
              <th className="text-center" style={{width: '100px'}}>HÌNH</th>
              <th>TÊN SẢN PHẨM</th>
              <th className="text-center">GIÁ</th>
              <th className="text-center">KHO</th>
              <th className="text-end">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id}>
                <td className="text-center"><img src={p.image} alt={p.name} /></td>
                <td>
                  <div className="fw-bold text-dark">{p.name}</div>
                  <small className="text-muted">ID: {p._id.slice(-6)}</small>
                </td>
                <td className="text-center fw-bold text-danger">{Number(p.price).toLocaleString()}đ</td>
                <td className="text-center">
                  <span className={`badge ${p.countInStock > 5 ? 'bg-success' : 'bg-warning'}`}>
                    {p.countInStock}
                  </span>
                </td>
                <td className="text-end">
                  {/* BỔ SUNG: onClick chạy hàm handleEdit */}
                  <Button variant="outline-primary" size="sm" className="me-2 border-0" onClick={() => handleEdit(p)}>
                    <FaEdit />
                  </Button>
                  <Button variant="outline-danger" size="sm" className="border-0" 
                    onClick={async () => { if(window.confirm('Xóa?')) { await axios.delete(`http://localhost:5000/api/cards/${p._id}`); getProducts(); }}}>
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal show={show} onHide={() => setShow(false)} centered>
        <Form onSubmit={saveProduct}>
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold">{isEdit ? 'CHỈNH SỬA SẢN PHẨM' : 'THÊM SẢN PHẨM MỚI'}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-0">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Tên sản phẩm</Form.Label>
              <Form.Control 
                className="tcg-input" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                required 
              />
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Giá (VNĐ)</Form.Label>
                  <Form.Control 
                    className="tcg-input" 
                    type="number" 
                    value={form.price} 
                    onChange={e => setForm({...form, price: e.target.value})} 
                    required 
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Số lượng</Form.Label>
                  <Form.Control 
                    className="tcg-input" 
                    type="number" 
                    value={form.countInStock} 
                    onChange={e => setForm({...form, countInStock: e.target.value})} 
                    required 
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Link hình ảnh</Form.Label>
              <Form.Control 
                className="tcg-input" 
                value={form.image} 
                onChange={e => setForm({...form, image: e.target.value})} 
                required 
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={() => setShow(false)}>Hủy</Button>
            <Button type="submit" variant="danger" className="px-4">
              {isEdit ? 'CẬP NHẬT' : 'LƯU SẢN PHẨM'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminProductList;