const Product = require('../models/Product');
const Category = require('../models/Category');
const Rarity = require('../models/Rarity');
const Review = require('../models/Review');
const User = require('../models/User');
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
        res.status(500).json({ message: 'Error loading product list: ' + error.message });
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
                { model: Review, as: 'reviews', include: [{ model: User, as: 'UserData' }] }
            ]
        });
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
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
            action: `Add new product #${product.id}`,
            details: `Product name: ${product.name} | Initial stock: ${product.countInStock}`
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error creating product: ' + error.message });
    }
};

// @desc    Cập nhật sản phẩm & Tự động ghi Log kho (Staff / Admin)
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found!' });

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
                reason: req.body.changeReason || 'Inventory change'
            });
        }

        // 2. Tự động ghi Staff Activity Log
        await StaffLog.create({
            staffId: req.user.id,
            action: `Update product #${product.id}`,
            details: `Name: ${product.name} | New Stock: ${newStock}`
        });

        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error updating product: ' + error.message });
    }
};

// @desc    Xóa sản phẩm (Staff / Admin)
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found!' });

        const productName = product.name;
        await product.destroy();

        // Ghi Staff Activity Log
        await StaffLog.create({
            staffId: req.user.id,
            action: `Delete product #${req.params.id}`,
            details: `Deleted product name: ${productName}`
        });

        res.json({ message: 'Product deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product: ' + error.message });
    }
};

// @desc    Lấy danh sách các độ hiếm (Rarities)
// @route   GET /api/products/rarities
const getRarities = async (req, res) => {
    try {
        const rarities = await Rarity.findAll();
        res.json(rarities);
    } catch (error) {
        res.status(500).json({ message: 'Error loading rarities: ' + error.message });
    }
};

// @desc    Lấy danh sách các loại sản phẩm (Categories)
// @route   GET /api/products/categories
const getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error loading categories: ' + error.message });
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
        res.status(500).json({ message: 'Error creating review: ' + error.message });
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