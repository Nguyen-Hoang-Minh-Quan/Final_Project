const express = require('express');
const router = express.Router();
const { getAllReviews, deleteReview, replyReview } = require('../controllers/reviewController');
const { protect, staffOrAdmin } = require('../middleware/authMiddleware');

// Route lấy danh sách (Hỗ trợ cả GET / và GET /all để chống lệch endpoint)
router.get('/', protect, staffOrAdmin, getAllReviews);
router.get('/all', protect, staffOrAdmin, getAllReviews);

// Route phản hồi đánh giá cho Staff/Admin
router.put('/:id/reply', protect, staffOrAdmin, replyReview);

// Route xóa đánh giá cho Admin
router.delete('/:id', protect, staffOrAdmin, deleteReview);

module.exports = router;