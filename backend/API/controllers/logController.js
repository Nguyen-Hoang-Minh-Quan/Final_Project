const InventoryLog = require('../models/InventoryLog');
const StaffLog = require('../models/StaffLog');
const User = require('../models/User');
const Product = require('../models/Product');

const getInventoryLogs = async (req, res) => {
    try {
        const logs = await InventoryLog.findAll({
            order: [['id', 'DESC']]
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStaffLogs = async (req, res) => {
    try {
        const logs = await StaffLog.findAll({
            order: [['id', 'DESC']]
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getInventoryLogs, getStaffLogs };