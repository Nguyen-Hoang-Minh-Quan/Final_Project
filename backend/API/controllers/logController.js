const InventoryLog = require('../models/InventoryLog');
const StaffLog = require('../models/StaffLog');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Lấy danh sách log kho
// @route   GET /api/logs/inventory
// @access  Private (Staff/Admin)
const getInventoryLogs = async (req, res) => {
    try {
        const logs = await InventoryLog.findAll({ // Lấy tất cả các log kho
            order: [['id', 'DESC']]
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inventory logs: ' + error.message });
    }
};

const getStaffLogs = async (req, res) => {
    try {
        const logs = await StaffLog.findAll({
            order: [['id', 'DESC']]
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching staff logs: ' + error.message });
    }
};

module.exports = { getInventoryLogs, getStaffLogs };