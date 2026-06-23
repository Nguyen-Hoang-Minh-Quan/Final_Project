const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Kiểm tra xem người dùng đã đăng nhập chưa (Có Token hợp lệ không)
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Lấy token từ chuỗi "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            // Giải mã token để lấy ID user
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Tìm user trong database bằng ID và loại bỏ trường password ra khỏi request cho an toàn
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            });

            if (!req.user) {
                return res.status(401).json({ message: 'Người dùng không tồn tại trên hệ thống!' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy Token, quyền truy cập bị từ chối!' });
    }
};

// Kiểm tra xem tài khoản có phải là Quản trị viên (Admin) không
const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Yêu cầu quyền Quản trị viên (Admin)!' });
    }
};

module.exports = { protect, admin };