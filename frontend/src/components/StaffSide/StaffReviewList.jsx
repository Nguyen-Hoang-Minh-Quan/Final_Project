import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaComment, FaReply, FaStar, FaChevronLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosClient from '../../api/axiosClient';
import '../../styles/TCGStyles.css';

const StaffReviewList = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchReviews = async () => {
    try {
      const { data } = await axiosClient.get('/products/reviews/all'); // API lấy toàn bộ reviews
      setReviews(data);
    } catch (error) {
      console.error("Lỗi tải đánh giá:", error);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleOpenReply = (review) => {
    setSelectedReview(review);
    setReplyText(review.reply || '');
    setShowReplyModal(true);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.put(`/products/reviews/${selectedReview.id}/reply`, { reply: replyText });
      toast.success("Đã gửi phản hồi cho khách hàng!");
      setShowReplyModal(false);
      fetchReviews();
    } catch (error) {
      toast.error("Lỗi khi gửi phản hồi!");
    }
  };

  return (
    <Container className="main-layout py-4">
      <Card className="border-0 shadow-sm p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1"><FaComment className="text-info me-2" />QUẢN LÝ ĐÁNH GIÁ CỦA KHÁCH HÀNG</h2>
            <Button variant="outline-secondary" size="sm" className="border-0 tcg-btn" onClick={() => navigate('/admin')}>
              <FaChevronLeft className="me-1" /> QUAY LẠI DASHBOARD
            </Button>
          </div>
        </div>

        <Table responsive hover className="admin-table border-top">
          <thead>
            <tr>
              <th>KHÁCH HÀNG</th>
              <th>SẢN PHẨM</th>
              <th>ĐÁNH GIÁ</th>
              <th>NỘI DUNG nhận xét</th>
              <th>PHẢN HỒI TỪ STAFF</th>
              <th className="text-end">THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id}>
                <td className="fw-bold">{r.UserData?.name || `User #${r.userId}`}</td>
                <td>{r.ProductData?.name || `Product #${r.productId}`}</td>
                <td>
                  <Badge bg="warning" text="dark">
                    {r.rating} <FaStar className="ms-1" />
                  </Badge>
                </td>
                <td>{r.comment}</td>
                <td>
                  {r.reply ? (
                    <span className="text-success small fw-bold">{r.reply}</span>
                  ) : (
                    <span className="text-muted small italic">Chưa phản hồi</span>
                  )}
                </td>
                <td className="text-end">
                  <Button variant="outline-primary" size="sm" onClick={() => handleOpenReply(r)}>
                    <FaReply className="me-1" /> Phản hồi
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* MODAL GỬI PHẢN HỒI */}
      <Modal show={showReplyModal} onHide={() => setShowReplyModal(false)} centered>
        <Form onSubmit={handleSendReply}>
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold fs-6">PHẢN HỒI ĐÁNH GIÁ CỦA {selectedReview?.UserData?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3 p-2 bg-light rounded small">
              <strong>Nhận xét của khách:</strong> "{selectedReview?.comment}"
            </div>
            <Form.Group>
              <Form.Label className="fw-bold small">Nội dung phản hồi từ Nhân viên</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Nhập câu trả lời lịch sự, hỗ trợ khách hàng..."
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowReplyModal(false)}>Hủy</Button>
            <Button type="submit" variant="info" className="text-white fw-bold">GỬI PHẢN HỒI</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default StaffReviewList;