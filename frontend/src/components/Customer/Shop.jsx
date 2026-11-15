import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; 
import { Container, Row, Col, Card, Button, Badge, Form, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaFilter } from 'react-icons/fa';
import axiosClient from '../../api/axiosClient';
import '../../styles/TCGStyles.css';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdFromUrl = searchParams.get('categoryId');
  const keywordFromUrl = searchParams.get('keyword'); 

  const [categoryFilter, setCategoryFilter] = useState('all'); 
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [sortOrder, setSortOrder] = useState('default'); 

  // Luồng 1: Tải dữ liệu ban đầu
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          axiosClient.get('/products'),
          axiosClient.get('/products/categories')
        ]);
        
        setProducts(prodRes.data);
        setFilteredProducts(prodRes.data);
        setCategories(catRes.data);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi API Shop, sử dụng dữ liệu tĩnh bộ lọc:", error);
        setCategories([
          { id: 1, name: 'Booster Box' },
          { id: 2, name: 'Elite Trainer Box (ETB)' },
          { id: 3, name: 'Single Cards' },
          { id: 4, name: 'TCG Accessories' },
          { id: 5, name: 'Single Pack' },
          { id: 6, name: 'Sleeves Cards' },
        ]);
        toast.error("Không thể tải toàn bộ danh sách sản phẩm!");
        setLoading(false);
      }
    };
    fetchShopData();
  }, []);

  // Luồng 2: Đồng bộ danh mục từ URL vào Bộ lọc
  useEffect(() => {
    if (categoryIdFromUrl) {
      setCategoryFilter(categoryIdFromUrl);
    } else {
      setCategoryFilter('all');
    }
  }, [categoryIdFromUrl]);

  // Luồng 3: Xử lý bộ lọc đa điều kiện (Bao gồm cả Keyword tìm kiếm)
  useEffect(() => {
    let result = [...products];

    // Lọc sản phẩm theo từ khóa tìm kiếm (Không phân biệt chữ hoa, chữ thường)
    if (keywordFromUrl) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(keywordFromUrl.toLowerCase())
      );
    }

    // 1. Khớp theo danh mục
    if (categoryFilter !== 'all') {
      result = result.filter(p => Number(p.categoryId) === Number(categoryFilter));
    }

    // 2. Lọc theo trạng thái kho
    if (statusFilter === 'inStock') {
      result = result.filter(p => p.countInStock > 0);
    } else if (statusFilter === 'outOfStock') {
      result = result.filter(p => p.countInStock <= 0);
    }

    // 3. Sắp xếp theo giá
    if (sortOrder === 'lowToHigh') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'highToLow') {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(result);
  }, [categoryFilter, statusFilter, sortOrder, products, keywordFromUrl]); // thêm keywordFromUrl vào mảng phụ thuộc

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    // Khi đổi danh mục, giữ lại keyword hiện tại nếu có
    const newParams = {};
    if (val !== 'all') newParams.categoryId = val;
    if (keywordFromUrl) newParams.keyword = keywordFromUrl;
    setSearchParams(newParams);
  };

  const addToCart = (product) => {
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const existItem = cartItems.find(x => x.id === product.id);
    if (existItem) {
      if (existItem.qty < product.countInStock) {
        existItem.qty += 1;
      } else {
        return toast.error("Insufficient stock!");
      }
    } else {
      cartItems.push({ ...product, qty: 1 });
    }
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    const uInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (uInfo && uInfo.id) {
      localStorage.setItem(`cartItems_${uInfo.id}`, JSON.stringify(cartItems));
    }
    window.dispatchEvent(new Event("cartUpdated"));
    toast.success(`Added to cart!`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  return (
    <Container className="main-layout py-4">
      <Row>
        {/* THANH BỘ LỌC BÊN TRÁI (SIDEBAR) */}
        <Col lg={3} md={4} className="mb-4">
          <Card className="p-3 border-0 shadow-sm bg-light">
            <h5 className="fw-bold mb-3 d-flex align-items-center">
              <FaFilter className="me-2 text-danger" size={16} /> PRODUCT FILTERS
            </h5>
            
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-secondary">CARD CATALOG</Form.Label>
              <Form.Select 
                className="tcg-input" 
                value={categoryFilter} 
                onChange={handleCategoryChange}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-secondary">STATUS</Form.Label>
              <Form.Select className="tcg-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Products</option>
                <option value="inStock">In Stock</option>
                <option value="outOfStock">Out of Stock</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-bold text-secondary">SORT BY PRICE</Form.Label>
              <Form.Select className="tcg-input" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                <option value="default">Default</option>
                <option value="lowToHigh">Price: Low to High</option>
                <option value="highToLow">Price: High to Low</option>
              </Form.Select>
            </Form.Group>

            {/* Nút xóa nhanh trạng thái tìm kiếm nếu đang hiển thị kết quả search */}
            {keywordFromUrl && (
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="w-100 mt-3 fw-bold"
                onClick={() => setSearchParams(categoryIdFromUrl ? { categoryId: categoryIdFromUrl } : {})}
              >
                Clear keyword: "{keywordFromUrl}"
              </Button>
            )}
          </Card>
        </Col>

        {/* LƯỚI HIỂN THỊ SẢN PHẨM BÊN PHẢI */}
        <Col lg={9} md={8}>
          {/* Tiêu đề động hiển thị rõ từ khóa tìm kiếm nếu có */}
          <h3 className="fw-bold mb-4 text-uppercase fs-4 border-bottom pb-2">
            {keywordFromUrl ? `Search results for: "${keywordFromUrl}"` : "Card Shop"} ({filteredProducts.length})
          </h3>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-5 text-muted">No products found matching your filter criteria.</div>
          ) : (
            <Row xs={1} sm={2} md={3} className="g-4">
              {filteredProducts.map(product => (
                <Col key={product.id}>
                  <Card className="tcg-card h-100 shadow-sm border-0 position-relative overflow-hidden">
                    {product.countInStock <= 0 && (
                      <Badge bg="secondary" className="position-absolute top-0 start-0 m-2 z-1">OUT OF STOCK</Badge>
                    )}
                    <Link to={`/product/${product.id}`} className="text-decoration-none">
                      <div className="p-3" style={{ height: '220px' }}>
                        <Card.Img src={product.image} className="w-100 h-100 item-smooth-zoom" style={{ objectFit: 'contain' }} />
                      </div>
                    </Link>
                    <Card.Body className="d-flex flex-column text-center bg-light pt-2">
                      <Link to={`/product/${product.id}`} className="text-decoration-none text-dark hover-danger">
                        <Card.Title className="fw-bold text-truncate mb-2" style={{ fontSize: '0.9rem' }}>
                          {product.name}
                        </Card.Title>
                      </Link>
                      
                      {product.RarityData?.name && (
                        <div className="mb-2">
                          <span className="badge bg-warning text-dark px-2 py-0.5 fw-bold" style={{ fontSize: '0.65rem' }}>
                            {product.RarityData.name}
                          </span>
                        </div>
                      )}

                      <Card.Text className="text-danger fw-bold mb-3">{Number(product.price).toLocaleString()}đ</Card.Text>
                      
                      <Button 
                        className="tcg-btn mt-auto py-2 fw-bold w-100" 
                        variant={product.countInStock > 0 ? "warning" : "secondary"}
                        disabled={product.countInStock <= 0}
                        onClick={() => addToCart(product)}
                        style={{ fontSize: '0.8rem' }}
                      >
                        {product.countInStock > 0 ? "ADD TO CART" : "OUT OF STOCK"}
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Shop;