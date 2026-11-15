const Review = require('../models/Review');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Lấy toàn bộ đánh giá hệ thống kèm thông tin User và Product
// @route   GET /api/reviews
// @access  Private/Staff/Admin
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.findAll({
            include: [
                {
                    model: User,
                    as: 'UserData',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Product,
                    as: 'ProductData',
                    attributes: ['id', 'name', 'image']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(reviews);
    } catch (error) {
        console.error("Error retrieving all reviews:", error);
        res.status(500).json({ message: "Error retrieving all reviews!" });
    }
};

// @desc    Staff/Admin phản hồi đánh giá
// @route   PUT /api/reviews/:id/reply
// @access  Private/Staff/Admin
const replyReview = async (req, res) => {
    try {
        const { reply } = req.body;
        const review = await Review.findByPk(req.params.id);

        if (!review) {
            return res.status(404).json({ message: "Review not found!" });
        }

        review.reply = reply;
        await review.save();

        res.json({ message: "Reply saved successfully!", review });
    } catch (error) {
        console.error("Error replying to review:", error);
        res.status(500).json({ message: "Failed to send reply!" });
    }
};

// @desc    Xóa đánh giá
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
const deleteReview = async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) {
            return res.status(404).json({ message: "Review not found!" });
        }
        await review.destroy();
        res.json({ message: "Review deleted successfully!" });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Failed to delete review!" });
    }
};

module.exports = {
    getAllReviews,
    replyReview,
    deleteReview
};