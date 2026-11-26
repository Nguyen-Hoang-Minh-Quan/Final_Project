const InventoryLog = require('../models/InventoryLog');
const StaffLog = require('../models/StaffLog');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Lấy danh sách log kho kèm thông tin sản phẩm và tài khoản thực hiện
// @route   GET /api/logs/inventory
// @access  Private (Staff/Admin)
const getInventoryLogs = async (req, res) => {
    try {
        // Join bảng Product và User (required: false để vẫn giữ log nếu user/product đã bị xóa)
        const logs = await InventoryLog.findAll({
            include: [
                {
                    model: User,
                    as: 'StaffData',
                    attributes: ['id', 'name', 'email', 'role', 'isAdmin'],
                    required: false
                },
                {
                    model: Product,
                    as: 'ProductData',
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            order: [['id', 'DESC']]
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inventory logs: ' + error.message });
    }
};

// @desc    Lấy danh sách nhật ký hoạt động của Staff/Admin kèm tên & chức vụ hiện tại
// @route   GET /api/logs/staff
// @access  Private (Admin)
const getStaffLogs = async (req, res) => {
    try {
        // Join bảng User qua alias 'StaffData' để lấy tên, email và role hiện tại
        const logs = await StaffLog.findAll({
            include: [
                {
                    model: User,
                    as: 'StaffData',
                    attributes: ['id', 'name', 'email', 'role', 'isAdmin'],
                    required: false
                }
            ],
            order: [['id', 'DESC']]
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching staff logs: ' + error.message });
    }
};

module.exports = { getInventoryLogs, getStaffLogs };