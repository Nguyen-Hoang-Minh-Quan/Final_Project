const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InventoryLog = sequelize.define('InventoryLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    staffId: { type: DataTypes.INTEGER, allowNull: false },
    changeType: { type: DataTypes.STRING, allowNull: false },
    oldStock: { type: DataTypes.INTEGER, allowNull: false },
    newStock: { type: DataTypes.INTEGER, allowNull: false },
    changeQuantity: { type: DataTypes.INTEGER, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true }
}, {
    tableName: 'InventoryLogs',
    timestamps: false
});

module.exports = InventoryLog;