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
      // 🌟 ĐÃ SỬA: Chuẩn hóa đường dẫn gọi tới API backend /reviews
      const { data } = await axiosClient.get('/reviews');
      setReviews(data);
    } catch (error) {
      console.error("Error loading reviews:", error);
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
      // Sửa lại endpoint khớp với router backend
      await axiosClient.put(`/reviews/${selectedReview.id}/reply`, { reply: replyText });
      toast.success("Response sent to the customer!");
      setShowReplyModal(false);
      fetchReviews();
    } catch (error) {
      toast.error("Error sending response!");
    }
  };

  return (
    <Container className="main-layout py-4">
      <Card className="border-0 shadow-sm p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1"><FaComment className="text-info me-2" />MANAGE CUSTOMER REVIEWS</h2>
            <Button variant="outline-secondary" size="sm" className="border-0 tcg-btn" onClick={() => navigate('/admin')}>
              <FaChevronLeft className="me-1" /> BACK TO DASHBOARD
            </Button>
          </div>
        </div>

        <Table responsive hover className="admin-table border-top">
          <thead>
            <tr>
              <th>CUSTOMER</th>
              <th>PRODUCT</th>
              <th>RATING</th>
              <th>REVIEW CONTENT</th>
              <th>RESPONSE FROM STAFF</th>
              <th className="text-end">ACTIONS</th>
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
                    <span className="text-muted small italic">Not replied yet</span>
                  )}
                </td>
                <td className="text-end">
                  <Button variant="outline-primary" size="sm" onClick={() => handleOpenReply(r)}>
                    <FaReply className="me-1" /> Reply
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
            <Modal.Title className="fw-bold fs-6">RESPONSE TO REVIEW FROM {selectedReview?.UserData?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3 p-2 bg-light rounded small">
              <strong>Customer's Review:</strong> "{selectedReview?.comment}"
            </div>
            <Form.Group>
              <Form.Label className="fw-bold small">Response Content from Staff</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Enter a polite and helpful response..."
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowReplyModal(false)}>Cancel</Button>
            <Button type="submit" variant="info" className="text-white fw-bold">SEND RESPONSE</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default StaffReviewList;