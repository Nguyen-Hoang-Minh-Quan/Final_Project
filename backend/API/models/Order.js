const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Product = require('./Product');

// 1. Định nghĩa bảng chính: Đơn hàng (Orders)
const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    paymentMethod: {
            type: DataTypes.STRING, // Dùng STRING thay vì ENUM để an toàn tuyệt đối
            allowNull: false,
            defaultValue: 'COD'
    },
    totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    isPaid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Pending'
    }
}, {
    timestamps: true
});

// 2. Định nghĩa bảng phụ: Chi tiết từng món trong đơn hàng (OrderItems)
const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    qty: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    timestamps: false
});

// 3. Thiết lập mối quan hệ Thực thể Quan hệ (Associations)
User.hasMany(Order, { foreignKey: 'userId', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'userId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'orderItems', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = { Order, OrderItem };