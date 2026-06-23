const express = require('express');
const router = express.Router();
const { getAllReviews, deleteReview } = require('../controllers/reviewController');

// Khớp nối endpoint /api/reviews với các hàm xử lý tương ứng
router.route('/')
    .get(getAllReviews);

router.route('/:id')
    .delete(deleteReview);

module.exports = router;