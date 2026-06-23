const Review = require('../models/Review');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Lấy toàn bộ đánh giá hệ thống kèm thông tin User và Product
// @route   GET /api/reviews
// @access  Private/Admin
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.findAll({
            include: [
                {
                    model: User,
                    as: 'UserData',
                    attributes: ['id', 'name', 'email'] // Bảo mật password, chỉ lấy thông tin cần thiết
                },
                {
                    model: Product,
                    as: 'ProductData',
                    attributes: ['id', 'name', 'image']
                }
            ],
            order: [['createdAt', 'DESC']] // Đánh giá mới nhất xếp lên đầu
        });
        res.json(reviews);
    } catch (error) {
        console.error("Lỗi lấy toàn bộ review:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi tải danh sách nhận xét!" });
    }
};

// @desc    Xóa đánh giá (Admin dọn dẹp spam)
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) {
            return res.status(404).json({ message: "Không tìm thấy đánh giá này!" });
        }
        await review.destroy();
        res.json({ message: "Đã xóa bỏ đánh giá thành công khỏi hệ thống!" });
    } catch (error) {
        console.error("Lỗi xóa review:", error);
        res.status(500).json({ message: "Xóa đánh giá thất bại!" });
    }
};

module.exports = {
    getAllReviews,
    deleteReview
};