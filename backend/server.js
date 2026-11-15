const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { connectDB, sequelize } = require('./API/config/db');

dotenv.config();

const User = require('./API/models/User');
const Product = require('./API/models/Product');
const { Order, OrderItem } = require('./API/models/Order');
const Category = require('./API/models/Category');
const Rarity = require('./API/models/Rarity');
const Review = require('./API/models/Review');
const Address = require('./API/models/Address');
const InventoryLog = require('./API/models/InventoryLog');
const StaffLog = require('./API/models/StaffLog');
const Blog = require('./API/models/Blog');

const chatRoutes = require('./API/routes/chatRoutes');
const logRoutes = require('./API/routes/logRoutes');

// --- ASSOCIATIONS ---
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'CategoryData' });

Rarity.hasMany(Product, { foreignKey: 'rarityId', as: 'products', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
Product.belongsTo(Rarity, { foreignKey: 'rarityId', as: 'RarityData' });

Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'ProductData' });

User.hasMany(Review, { foreignKey: 'userId', as: 'reviews', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'UserData' });

OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'ProductData' });

InventoryLog.belongsTo(User, { foreignKey: 'staffId', as: 'StaffData' });
InventoryLog.belongsTo(Product, { foreignKey: 'productId', as: 'ProductData' });
StaffLog.belongsTo(User, { foreignKey: 'staffId', as: 'StaffData' });

User.hasMany(Blog, { foreignKey: 'authorId', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
Blog.belongsTo(User, { foreignKey: 'authorId', as: 'AuthorData' });

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./API/routes/authRoutes');
const productRoutes = require('./API/routes/productRoutes');
const orderRoutes = require('./API/routes/orderRoutes');
const reviewRoutes = require('./API/routes/reviewRoutes'); 

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes); 
app.use('/api/addresses', require('./API/routes/addressRoutes'));
app.use('/api/chat', chatRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/blogs', require('./API/routes/blogRoutes'));

app.get('/', (req, res) => {
    res.send('--- [SERVER] TCG SHOP POSTGRES API IS RUNNING ---');
});

const startServer = async () => {
    await connectDB();

    try {
        await sequelize.sync({ alter: true });
        console.log("--- [SUCCESS] Đã đồng bộ và cập nhật cấu trúc bảng (Khóa ngoại) lên Neon ---");
    } catch (error) {
        console.error("--- [ERROR] Đồng bộ cấu trúc Database thất bại: ", error.message);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`--- [READY] Server đang chạy mượt mà tại port ${PORT} ---`);
    });
};

startServer();