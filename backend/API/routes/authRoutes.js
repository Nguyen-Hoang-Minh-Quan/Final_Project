const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile, 
    forgotPassword, 
    resetPassword, 
    resetPasswordWithOtp,
    getUsers, 
    updateUserRole 
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password-otp', resetPasswordWithOtp);
router.post('/reset-password/:token', resetPassword);

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

router.get('/users', protect, admin, getUsers);
router.put('/users/:id/role', protect, admin, updateUserRole);

module.exports = router;