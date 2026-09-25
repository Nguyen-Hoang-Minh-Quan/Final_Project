const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StaffLog = sequelize.define('StaffLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    staffId: { type: DataTypes.INTEGER, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    details: { type: DataTypes.TEXT, allowNull: true }
}, {
    tableName: 'StaffLogs',
    timestamps: false
});

module.exports = StaffLog;