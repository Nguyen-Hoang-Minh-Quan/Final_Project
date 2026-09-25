const express = require('express');
const router = express.Router();
const { 
    getMyAddresses, 
    addAddress, 
    setDefaultAddress, 
    deleteAddress 
} = require('../controllers/addressController');
const { protect } = require('../middleware/authMiddleware'); // Middleware check Token đăng nhập của bạn

// Tất cả các router địa chỉ đều yêu cầu đăng nhập hệ thống
router.route('/')
    .get(protect, getMyAddresses)
    .post(protect, addAddress);

router.route('/:id/default')
    .put(protect, setDefaultAddress);

router.route('/:id')
    .delete(protect, deleteAddress);

module.exports = router;