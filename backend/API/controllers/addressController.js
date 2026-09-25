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
        res.status(500).json({ message: 'Không thể lấy danh sách địa chỉ: ' + error.message });
    }
};

// @desc    Thêm một địa chỉ nhận hàng mới
// @route   POST /api/addresses
// @access  Private
const addAddress = async (req, res) => {
    const { receiverName, phone, details, isDefault } = req.body;

    try {
        if (!receiverName || !phone || !details) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin bắt buộc!' });
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
        res.status(500).json({ message: 'Lỗi khi tạo địa chỉ mới: ' + error.message });
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
            return res.status(404).json({ message: 'Không tìm thấy địa chỉ này của bạn!' });
        }

        // Hạ tất cả các địa chỉ khác của user thành false
        await Address.update({ isDefault: false }, { where: { userId: req.user.id } });

        // Kích hoạt địa chỉ hiện tại thành true
        address.isDefault = true;
        await address.save();

        res.status(200).json({ message: 'Đã cập nhật địa chỉ mặc định thành công!', address });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi thiết lập mặc định: ' + error.message });
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
            return res.status(404).json({ message: 'Địa chỉ không tồn tại hoặc không thuộc quyền sở hữu!' });
        }

        if (address.isDefault) {
            return res.status(400).json({ message: 'Không thể xóa địa chỉ đang được đặt làm mặc định!' });
        }

        await address.destroy();
        res.status(200).json({ message: 'Xóa địa chỉ thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa địa chỉ: ' + error.message });
    }
};

module.exports = {
    getMyAddresses,
    addAddress,
    setDefaultAddress,
    deleteAddress
};