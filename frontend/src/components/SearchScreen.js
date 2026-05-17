import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Home from './Home';
import '../styles/TCGStyles.css';

const SearchScreen = () => {
  const { keyword } = useParams();
  const [results, setResults] = useState([]);

  useEffect(() => {
    const searchCards = async () => {
      if (!keyword) return;
      try {
        // Sửa thành Query String để khớp Backend của Quân
        const { data } = await axios.get(`http://localhost:5000/api/cards/search?keyword=${keyword}`);
        setResults(data);
      } catch (err) {
        console.error("Lỗi:", err);
      }
    };
    searchCards();
  }, [keyword]);

  return (
    <Container className="main-layout">
      <h3 className="section-title">KẾT QUẢ TÌM KIẾM: "{keyword}"</h3>
      {results.length === 0 ? (
        <p className="text-muted">Không tìm thấy sản phẩm nào phù hợp.</p>
      ) : (
        <Home customData={results} />
      )}
    </Container>
  );
};
export default SearchScreen;