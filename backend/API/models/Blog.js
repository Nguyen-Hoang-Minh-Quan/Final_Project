const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Blog = sequelize.define('Blog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    summary: { type: DataTypes.TEXT, allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    image: { type: DataTypes.TEXT, allowNull: true },
    authorId: { type: DataTypes.INTEGER, allowNull: true }
}, {
    tableName: 'Blogs',
    timestamps: true
});

module.exports = Blog;