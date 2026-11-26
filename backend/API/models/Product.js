const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('Single Card', 'Pack', 'Booster Box', 'Elite Trainer Box', 'Sleeves', 'Other accessories'),
        allowNull: false,
        defaultValue: 'Single Card'
    },
    // Phân loại thể loại Card Game (Mở rộng cho One Piece, Yu-Gi-Oh!...)
    gameType: {
        type: DataTypes.ENUM('Pokémon', 'One Piece', 'Yu-Gi-Oh!', 'Magic: The Gathering', 'None'),
        allowNull: false,
        defaultValue: 'Pokémon'
    },
    // Độ hiếm thẻ bài (Nếu là phụ kiện hoặc box thì có thể để N/A)
    rarity: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'N/A'
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    countInStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Product;