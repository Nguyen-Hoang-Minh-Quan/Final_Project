import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Table, Button, Modal, Form, Card, Row, Col } from 'react-bootstrap';
import axiosClient from '../../api/axiosClient'; 
import { FaPlus, FaTrash, FaEdit, FaBox, FaChevronLeft } from 'react-icons/fa';
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
      console.error("Lỗi tải dữ liệu sản phẩm:", err); 
    }
  };

  const getRaritiesData = async () => {
    try {
      const { data } = await axiosClient.get('/products/rarities');
      setRarities(data);
    } catch (err) {
      console.error("Lỗi tải danh sách độ hiếm:", err);
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
      price: 0, 
      image: '', 
      countInStock: 0, 
      categoryId: '1', 
      gameType: 'Pokémon',
      rarityId: rarities[0]?.id || '',
      description: '',
      changeReason: 'Nhập hàng mới vào kho'
    });
    setShow(true);
  };

  const handleEdit = (product) => {
    setIsEdit(true);
    setCurrentId(product.id);
    setForm({
      name: product.name,
      price: product.price,
      image: product.image,
      countInStock: product.countInStock || 0,
      categoryId: product.categoryId || '',
      gameType: product.gameType || 'Pokémon',
      rarityId: product.rarityId || '',
      description: product.description || '',
      changeReason: 'Cập nhật thông tin sản phẩm'
    });
    setShow(true);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...form,
        price: Number(form.price),
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
      console.error("Chi tiết lỗi từ Server:", err.response?.data);
      alert("Có lỗi xảy ra: " + (err.response?.data?.message || "Vui lòng kiểm tra lại dữ liệu!"));
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
      try {
        await axiosClient.delete(`/products/${id}`);
        getProducts();
      } catch (err) {
        alert("Lỗi khi xóa sản phẩm!");
      }
    }
  };

  return (
    <Container className="main-layout">
      <Card className="border-0 shadow-sm p-4">
        <Row className="align-items-center mb-4">
          <Col>
            <h2 className="fw-bold mb-2"><FaBox className="text-danger me-2"/>KHO SẢN PHẨM</h2>
            <Button variant="outline-secondary" size="sm" className="me-3 border-0 tcg-btn" onClick={() => navigate('/admin')}>
              <FaChevronLeft className="me-1"/> QUAY LẠI
            </Button>
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
              <th>THỂ LOẠI GAME</th> 
              <th>LOẠI HÀNG</th> 
              <th className="text-center">GIÁ</th>
              <th className="text-center">KHO</th>
              <th className="text-end">HÀNH ĐỘNG</th>
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
                    <FaEdit />
                  </Button>
                  <Button variant="outline-danger" size="sm" className="border-0" onClick={() => deleteProduct(p.id)}>
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
                  <Form.Label className="small fw-bold">Số lượng trong kho</Form.Label>
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
                  <Form.Label className="small fw-bold">Thể Loại Card Game (gameType)</Form.Label>
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
                  <Form.Label className="small fw-bold">Loại sản phẩm (category)</Form.Label>
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
              <Form.Label className="small fw-bold">Độ hiếm (Rarity)</Form.Label>
              <Form.Select
                className="tcg-input"
                value={form.rarityId}
                onChange={e => setForm({...form, rarityId: e.target.value})}
                required
              >
                <option value="">-- Chọn độ hiếm --</option>
                {rarities.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Mô tả sản phẩm (Description)</Form.Label>
              <Form.Control 
                className="tcg-input" 
                as="textarea"
                rows={3}
                placeholder="Nhập thông tin chi tiết về thẻ bài/hộp bài (ví dụ: Tình trạng card, ngôn ngữ, năm phát hành...)"
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-danger">Lý do thay đổi kho hàng / Ghi chú Log</Form.Label>
              <Form.Control 
                className="tcg-input" 
                value={form.changeReason} 
                placeholder="Nhập lý do (ví dụ: Nhập hàng mới, Hàng bị hỏng, Điều chỉnh kiểm kê...)"
                onChange={e => setForm({...form, changeReason: e.target.value})} 
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Link hình ảnh sản phẩm</Form.Label>
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