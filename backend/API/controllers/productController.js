const Product = require('../models/Product');
const Category = require('../models/Category');
const Rarity = require('../models/Rarity');
const Review = require('../models/Review');
const InventoryLog = require('../models/InventoryLog');
const StaffLog = require('../models/StaffLog');

// @desc    Lấy danh sách tất cả sản phẩm
// @route   GET /api/products
const getProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: [
                { model: Category, as: 'CategoryData', attributes: ['id', 'name'] },
                { model: Rarity, as: 'RarityData', attributes: ['id', 'name'] }
            ],
            order: [['id', 'DESC']]
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tải danh sách sản phẩm: ' + error.message });
    }
};

// @desc    Lấy chi tiết 1 sản phẩm theo ID
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id, {
            include: [
                { model: Category, as: 'CategoryData' },
                { model: Rarity, as: 'RarityData' },
                { model: Review, as: 'reviews' }
            ]
        });
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};

// @desc    Tạo sản phẩm mới (Staff / Admin)
// @route   POST /api/products
const createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);

        // Ghi Staff Activity Log
        await StaffLog.create({
            staffId: req.user.id,
            action: `Thêm sản phẩm mới #${product.id}`,
            details: `Tên sản phẩm: ${product.name} | Kho ban đầu: ${product.countInStock}`
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tạo sản phẩm: ' + error.message });
    }
};

// @desc    Cập nhật sản phẩm & Tự động ghi Log kho (Staff / Admin)
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm!' });

        const oldStock = product.countInStock;
        const newStock = Number(req.body.countInStock);
        const changeQty = newStock - oldStock;

        await product.update(req.body);

        // 1. Tự động ghi Inventory Log nếu có thay đổi số lượng kho
        if (changeQty !== 0) {
            await InventoryLog.create({
                productId: product.id,
                staffId: req.user.id,
                changeType: changeQty > 0 ? 'IMPORT' : 'UPDATE',
                oldStock,
                newStock,
                changeQuantity: changeQty,
                reason: req.body.changeReason || 'Thay đổi kiểm kê'
            });
        }

        // 2. Tự động ghi Staff Activity Log
        await StaffLog.create({
            staffId: req.user.id,
            action: `Cập nhật sản phẩm #${product.id}`,
            details: `Tên: ${product.name} | Kho mới: ${newStock}`
        });

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật sản phẩm: ' + error.message });
    }
};

// @desc    Xóa sản phẩm (Staff / Admin)
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm!' });

        const productName = product.name;
        await product.destroy();

        // Ghi Staff Activity Log
        await StaffLog.create({
            staffId: req.user.id,
            action: `Xóa sản phẩm #${req.params.id}`,
            details: `Tên sản phẩm đã xóa: ${productName}`
        });

        res.json({ message: 'Đã xóa sản phẩm thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa sản phẩm: ' + error.message });
    }
};

// @desc    Lấy danh sách các độ hiếm (Rarities)
// @route   GET /api/products/rarities
const getRarities = async (req, res) => {
    try {
        const rarities = await Rarity.findAll();
        res.json(rarities);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tải độ hiếm: ' + error.message });
    }
};

// @desc    Lấy danh sách các loại sản phẩm (Categories)
// @route   GET /api/products/categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tải danh mục: ' + error.message });
    }
};

// @desc    Đánh giá sản phẩm
// @route   POST /api/products/:id/reviews
const createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const review = await Review.create({
            productId: Number(req.params.id),
            userId: req.user.id,
            rating,
            comment
        });
        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tạo đánh giá: ' + error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getRarities,
    getCategories,
    createProductReview
};