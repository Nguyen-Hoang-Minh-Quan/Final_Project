const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const jwt = require('jsonwebtoken');

// Sử dụng mã bí mật từ .env hoặc chuỗi dự phòng khớp với Middleware
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'quan_tcg_secret_2026', { 
        expiresIn: '30d' 
    });
};

// --- ĐĂNG KÝ ---
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'Email đã tồn tại!' });

        // Tạo user mới (Mặc định isAdmin sẽ lấy từ default của Schema, thường là false)
        const user = await User.create({ name, email, password });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin || false,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi đăng ký rồi!' });
    }
});

// --- ĐĂNG NHẬP ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin || false,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Sai email hoặc mật khẩu!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi đăng nhập!' });
    }
});

module.exports = router;