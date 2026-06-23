const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, updateUserProfile, forgotPassword, resetPassword} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Cổng Đăng ký & Đăng nhập, Quên mật khẩu
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
// Cổng lấy thông tin cá nhân (Cần phải đi qua chốt chặn "protect" để xác thực token)
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

module.exports = router;