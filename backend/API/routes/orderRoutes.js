const express = require('express');
const router = express.Router();
const { 
    addOrderItems, 
    getOrderById, 
    getMyOrders, 
    getAllOrders, 
    updateOrderStatus, 
    getOrderStats,
    getTopProducts
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// 1. Các cổng thông thường không có tham số biến động
router.post('/', protect, addOrderItems);
router.get('/myorders', protect, getMyOrders);
router.get('/all', protect, getAllOrders); 

// 2. ĐẶT CÁC CỔNG THỐNG KÊ LÊN TRÊN cổng /:id để tránh Express nhận nhầm định tuyến
router.get('/stats', protect, getOrderStats);
router.get('/top-products', protect, getTopProducts);

// 3. Các cổng dùng biến động :id ĐẰNG SAU luôn đặt ở DƯỚI CÙNG
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, updateOrderStatus); 

module.exports = router;