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
const { protect, staffOrAdmin } = require('../middleware/authMiddleware');

// 1. Cổng tạo đơn & xem đơn cá nhân
router.post('/', protect, addOrderItems);
router.get('/myorders', protect, getMyOrders);

// 2. CỔNG LẤY TẤT CẢ ĐƠN HÀNG (Hỗ trợ cả / và /all cho Staff/Admin)
router.get('/', protect, staffOrAdmin, getAllOrders);
router.get('/all', protect, staffOrAdmin, getAllOrders); 

// 3. Đặt các cổng thống kê lên trên cổng /:id
router.get('/stats', protect, staffOrAdmin, getOrderStats);
router.get('/top-products', protect, staffOrAdmin, getTopProducts);

// 4. Các cổng dùng biến động :id đặt dưới cùng
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, staffOrAdmin, updateOrderStatus); 

module.exports = router;