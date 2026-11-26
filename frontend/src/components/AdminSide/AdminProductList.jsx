import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Table, Button, Modal, Form, Card, Row, Col } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient'; 
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilSquare, HiOutlineCube, HiOutlineChevronLeft } from 'react-icons/hi2';
import '../../styles/TCGStyles.css';

const AdminProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [rarities, setRarities] = useState([]);
  const [show, setShow] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [form, setForm] = useState({ 
    name: '', 
    price: 0, 
    image: '', 
    countInStock: 0, 
    categoryId: '',
    gameType: 'Pokémon',     
    rarityId: '',
    description: '',
    changeReason: ''
  });

  const getProducts = async () => {
    try {
      const { data } = await axiosClient.get('/products');
      setProducts(data);
    } catch (err) { 
      console.error("Error loading product data:", err); 
    }
  };

  const getRaritiesData = async () => {
    try {
      const { data } = await axiosClient.get('/products/rarities');
      setRarities(data);
    } catch (err) {
      console.error("Error loading rarity data:", err);
    }
  };

  useEffect(() => { 
    getProducts(); 
    getRaritiesData();
  }, []);

  const handleAdd = () => {
    setIsEdit(false);
    setForm({ 
      name: '', 
      price: '', 
      image: '', 
      countInStock: 0, 
      categoryId: '1', 
      gameType: 'Pokémon',
      rarityId: rarities[0]?.id || '',
      description: '',
      changeReason: 'New inventory entry'
    });
    setShow(true);
  };

  const handleEdit = (product) => {
    setIsEdit(true);
    setCurrentId(product.id);
    setForm({
      name: product.name,
      price: product.price ? Number(product.price) / 1000 : 0, // Quy đổi về nghìn đồng khi sửa
      image: product.image,
      countInStock: product.countInStock || 0,
      categoryId: product.categoryId || '',
      gameType: product.gameType || 'Pokémon',
      rarityId: product.rarityId || '',
      description: product.description || '',
      changeReason: 'Update product information'
    });
    setShow(true);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...form,
        price: Math.round(Number(form.price) * 1000), // Quy đổi: 1 = 1.000đ, 10 = 10.000đ
        countInStock: Number(form.countInStock),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        rarityId: form.rarityId ? Number(form.rarityId) : null
      };

      if (isEdit) {
        await axiosClient.put(`/products/${currentId}`, dataToSend);
      } else {
        await axiosClient.post('/products', dataToSend);
      }
      setShow(false);
      getProducts();
    } catch (err) {
      console.error("Error details from Server:", err.response?.data);
      alert("An error occurred: " + (err.response?.data?.message || "Please check your data!"));
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axiosClient.delete(`/products/${id}`);
        getProducts();
      } catch (err) {
        alert("Error occurred while deleting the product!");
      }
    }
  };

  return (
    <Container className="main-layout">
      <Card className="border-0 shadow-sm p-4">
        <Row className="align-items-center mb-4">
          <Col>
            <h2 className="fw-bold mb-2"><HiOutlineCube className="text-danger me-2"/>PRODUCT INVENTORY</h2>
            <Button variant="outline-secondary" size="sm" className="me-3 border-0 tcg-btn" onClick={() => navigate('/admin')}>
              <HiOutlineChevronLeft className="me-1"/> GO BACK
            </Button>
          </Col>
          <Col className="text-end">
            <Button className="tcg-btn px-4" variant="danger" onClick={handleAdd}>
              <HiOutlinePlus className="me-2"/> ADD NEW PRODUCT
            </Button>
          </Col>
        </Row>

        <Table responsive hover className="admin-table border-top">
          <thead>
            <tr>
              <th className="text-center" style={{width: '100px'}}>IMAGE</th>
              <th>PRODUCT NAME</th>
              <th>GAME TYPE</th> 
              <th>CATEGORY</th> 
              <th className="text-center">PRICE</th>
              <th className="text-center">STOCK</th>
              <th className="text-end">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td className="text-center">
                  <img src={p.image} alt={p.name} style={{ width: '50px', height: 'auto', borderRadius: '4px' }} />
                </td>
                <td>
                  <div className="fw-bold text-dark">{p.name}</div>
                  <small className="text-muted">Rarity: {p.RarityData?.name || 'N/A'}</small>
                </td>
                <td>
                  <span className="badge bg-primary">{p.gameType}</span>
                </td>
                <td>
                  <span className="badge bg-secondary">{p.CategoryData?.name || 'N/A'}</span>
                </td>
                <td className="text-center fw-bold text-danger">{Number(p.price).toLocaleString()}đ</td>
                <td className="text-center">
                  <span className={`badge ${p.countInStock > 5 ? 'bg-success' : 'bg-warning'}`}>
                    {p.countInStock}
                  </span>
                </td>
                <td className="text-end">
                  <Button variant="outline-primary" size="sm" className="me-2 border-0" onClick={() => handleEdit(p)}>
                    <HiOutlinePencilSquare />
                  </Button>
                  <Button variant="outline-danger" size="sm" className="border-0" onClick={() => deleteProduct(p.id)}>
                    <HiOutlineTrash />
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
            <Modal.Title className="fw-bold">{isEdit ? 'EDIT PRODUCT' : 'ADD NEW PRODUCT'}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-0">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Product Name</Form.Label>
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
                  <Form.Label className="small fw-bold">Price (x1.000 VNĐ - Nghìn đồng)</Form.Label>
                  <Form.Control 
                    className="tcg-input" 
                    type="number" 
                    step="any"
                    placeholder="VD: Nhập 1 = 1.000đ; 10 = 10.000đ"
                    value={form.price} 
                    onChange={e => setForm({...form, price: e.target.value})} 
                    required 
                  />
                  <div className="text-muted small mt-1" style={{ fontSize: '11px' }}>
                    Prices displayed on the web: <strong className="text-danger">{(Number(form.price || 0) * 1000).toLocaleString('vi-VN')}đ</strong>
                  </div>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Stock Quantity</Form.Label>
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

            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Game Type (gameType)</Form.Label>
                  <Form.Select 
                    className="tcg-input"
                    value={form.gameType} 
                    onChange={e => setForm({...form, gameType: e.target.value})} 
                    required
                  >
                    <option value="Pokémon">Pokémon</option>
                    <option value="One Piece">One Piece</option>
                    <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
                    <option value="Magic: The Gathering">Magic: The Gathering</option>
                    <option value="None">None</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Product Category (category)</Form.Label>
                  <Form.Select 
                    className="tcg-input"
                    value={form.categoryId} 
                    onChange={e => setForm({...form, categoryId: e.target.value})} 
                    required
                  >
                    <option value="1">Single Cards</option>
                    <option value="2">Elite Trainer Box</option>
                    <option value="3">Booster Box</option>
                    <option value="4">Sleeves Cards</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Rarity</Form.Label>
              <Form.Select
                className="tcg-input"
                value={form.rarityId}
                onChange={e => setForm({...form, rarityId: e.target.value})}
                required
              >
                <option value="">-- Select Rarity --</option>
                {rarities.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Product Description (Description)</Form.Label>
              <Form.Control 
                className="tcg-input" 
                as="textarea"
                rows={3}
                placeholder="Enter detailed information about the card box (e.g., card condition, language, release year...)"
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-danger">Reason for Stock Change / Log Notes</Form.Label>
              <Form.Control 
                className="tcg-input" 
                value={form.changeReason} 
                placeholder="Enter the reason for the stock change (e.g., New shipment, Damaged items, Inventory adjustment...)"
                onChange={e => setForm({...form, changeReason: e.target.value})} 
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Product image link</Form.Label>
              <Form.Control 
                className="tcg-input" 
                value={form.image} 
                onChange={e => setForm({...form, image: e.target.value})} 
                required 
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={() => setShow(false)}>Cancel</Button>
            <Button type="submit" variant="danger" className="px-4">
              {isEdit ? 'Update' : 'Save Product'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminProductList;