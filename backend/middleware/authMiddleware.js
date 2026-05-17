const jwt = require('jsonwebtoken');
const User = require('../API/models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      // Chuỗi 'quan_tcg_secret_2026' phải khớp tuyệt đối với authRoutes
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'quan_tcg_secret_2026');
      
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error("Lỗi Token:", error.message);
      res.status(401).json({ message: 'Không có quyền truy cập, token lỗi' });
    }
  }
  if (!token) {
    res.status(401).json({ message: 'Không có token, từ chối truy cập' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Bạn không phải là Admin' });
  }
};

module.exports = { protect, admin };