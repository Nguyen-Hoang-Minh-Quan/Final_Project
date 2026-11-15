const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); 
const User = require('./User');

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { 
            min: 1, 
            max: 5 
        }
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    reply: { 
        type: DataTypes.TEXT, 
        allowNull: true
    },
}, {
    timestamps: true,
    tableName: 'Reviews'
});

Review.belongsTo(User, { foreignKey: 'userId', as: 'UserData' });

module.exports = Review;