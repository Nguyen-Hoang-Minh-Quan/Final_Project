const Address = require('../models/Address');

// @desc    Lấy toàn bộ danh sách địa chỉ của User hiện tại (Ưu tiên mặc định lên đầu)
// @route   GET /api/addresses
// @access  Private
const getMyAddresses = async (req, res) => {
    try {
        const addresses = await Address.findAll({
            where: { userId: req.user.id },
            order: [
                ['isDefault', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });
        res.status(200).json(addresses);
    } catch (error) {
        res.status(500).json({ message: 'Unable to retrieve the list of addresses: ' + error.message });
    }
};

// @desc    Thêm một địa chỉ nhận hàng mới
// @route   POST /api/addresses
// @access  Private
const addAddress = async (req, res) => {
    const { receiverName, phone, details, isDefault } = req.body;

    try {
        if (!receiverName || !phone || !details) {
            return res.status(400).json({ message: 'Please fill in all required information!' });
        }

        // Đếm xem user đã có địa chỉ nào chưa
        const addressCount = await Address.count({ where: { userId: req.user.id } });

        // Logic xử lý thuộc tính mặc định:
        // Nếu đây là địa chỉ đầu tiên, bắt buộc phải là Mặc định. 
        // Nếu user tick chọn mặc định, hạ toàn bộ các địa chỉ cũ xuống thành false trước.
        let finalIsDefault = isDefault;
        if (addressCount === 0) {
            finalIsDefault = true;
        } else if (isDefault) {
            await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
        }

        const newAddress = await Address.create({
            userId: req.user.id,
            receiverName,
            phone,
            details,
            isDefault: finalIsDefault
        });

        res.status(201).json(newAddress);
    } catch (error) {
        res.status(500).json({ message: 'Error creating new address: ' + error.message });
    }
};

// @desc    Đặt một địa chỉ làm địa chỉ mặc định
// @route   PUT /api/addresses/:id/default
// @access  Private
const setDefaultAddress = async (req, res) => {
    try {
        const address = await Address.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!address) {
            return res.status(404).json({ message: 'Address not found!' });
        }

        // Hạ tất cả các địa chỉ khác của user thành false
        await Address.update({ isDefault: false }, { where: { userId: req.user.id } });

        // Kích hoạt địa chỉ hiện tại thành true
        address.isDefault = true;
        await address.save();

        res.status(200).json({ message: 'Default address updated successfully!', address });
    } catch (error) {
        res.status(500).json({ message: 'Error setting default address: ' + error.message });
    }
};

// @desc    Xóa một địa chỉ nhận hàng
// @route   DELETE /api/addresses/:id
// @access  Private
const deleteAddress = async (req, res) => {
    try {
        const address = await Address.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!address) {
            return res.status(404).json({ message: 'Address not found!' });
        }

        if (address.isDefault) {
            return res.status(400).json({ message: 'Cannot delete the default address!' });
        }

        await address.destroy();
        res.status(200).json({ message: 'Address deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting address: ' + error.message });
    }
};

module.exports = {
    getMyAddresses,
    addAddress,
    setDefaultAddress,
    deleteAddress
};