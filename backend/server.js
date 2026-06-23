const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { connectDB, sequelize } = require('./API/config/db');

// 1. Nạp cấu hình biến môi trường (.env) trước tiên
dotenv.config();

// 2. Ép Server nạp dữ liệu cấu trúc bảng (Models)
const User = require('./API/models/User');
const Product = require('./API/models/Product');
const { Order, OrderItem } = require('./API/models/Order');
const Category = require('./API/models/Category');
const Rarity = require('./API/models/Rarity');
const Review = require('./API/models/Review');
const chatRoutes = require('./API/routes/chatRoutes');

// ==================== THIẾT LẬP MỐI QUAN HỆ (ASSOCIATIONS) ====================

// A. Mối quan hệ giữa Category (Danh mục) và Product
Category.hasMany(Product, { 
    foreignKey: 'categoryId', 
    as: 'products', 
    onDelete: 'SET NULL', 
    onUpdate: 'CASCADE'
});
Product.belongsTo(Category, { 
    foreignKey: 'categoryId', 
    as: 'CategoryData'
});

// B. Mối quan hệ giữa Rarity (Độ hiếm) và Product
Rarity.hasMany(Product, { 
    foreignKey: 'rarityId', 
    as: 'products',
    onDelete: 'SET NULL', 
    onUpdate: 'CASCADE'
});
Product.belongsTo(Rarity, { 
    foreignKey: 'rarityId', 
    as: 'RarityData'
});

// C. Mối quan hệ giữa Product và Review
Product.hasMany(Review, { 
    foreignKey: 'productId', 
    as: 'reviews', 
    onDelete: 'CASCADE', 
    onUpdate: 'CASCADE'
});
Review.belongsTo(Product, { 
    foreignKey: 'productId', 
    as: 'ProductData'
});

// D. Mối quan hệ giữa User và Review (Giúp hiển thị tên khách hàng ở các trang Review)
User.hasMany(Review, {
    foreignKey: 'userId',
    as: 'reviews',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Review.belongsTo(User, {
    foreignKey: 'userId',
    as: 'UserData'
});

// E. Mối quan hệ giữa Đơn hàng và Người dùng / Chi tiết đơn hàng
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'UserData' });

OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'ProductData' });

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// =========================================================================

const app = express();

// 4. CÁC MIDDLEWARE CƠ BẢN (BẮT BUỘC PHẢI ĐẶT TRÊN ROUTES)
app.use(cors());
app.use(express.json()); // Đọc dữ liệu định dạng JSON gửi lên từ Frontend/Postman
app.use(express.urlencoded({ extended: true }));

// 5. ĐĂNG KÝ CÁC ĐƯỜNG DẪN API TRONG HỆ THỐNG
const authRoutes = require('./API/routes/authRoutes');
const productRoutes = require('./API/routes/productRoutes');
const orderRoutes = require('./API/routes/orderRoutes');
const reviewRoutes = require('./API/routes/reviewRoutes'); 

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes); 
app.use('/api/chat', chatRoutes); // Lắng nghe các request từ Chatbot (User/Admin)

// Cổng chạy thử kiểm tra xem trạng thái Server còn hoạt động không
app.get('/', (req, res) => {
    res.send('--- [SERVER] TCG SHOP POSTGRES API IS RUNNING ---');
});

// 6. HÀM KHỞI ĐỘNG SERVER VÀ ĐỒNG BỘ HOÁ DATABASE
const startServer = async () => {
    // Thực hiện kết nối tới Database Neon PostgreSQL thông qua config/db
    await connectDB();

    // Tiến hành kiểm tra và tự động cập nhật cấu trúc bảng dưới Database
    try {
        // Lệnh { alter: true } sẽ quét cấu trúc Code và tự động cập nhật các bảng/khóa ngoại còn thiếu
        await sequelize.sync({ alter: true });
        console.log("--- [SUCCESS] Đã đồng bộ và cập nhật cấu trúc bảng (Khóa ngoại) lên Neon ---");
    } catch (error) {
        console.error("--- [ERROR] Đồng bộ cấu trúc Database thất bại: ", error.message);
    }

    // Mở cổng lắng nghe cho ứng dụng Backend
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`--- [READY] Server đang chạy mượt mà tại port ${PORT} ---`);
    });
};

startServer();