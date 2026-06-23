const Product = require('../models/Product');
const Category = require('../models/Category');
const Rarity = require('../models/Rarity');
const Review = require('../models/Review');
const User = require('../models/User');
const { Op } = require('sequelize'); // Thư viện toán tử của Sequelize để làm tính năng tìm kiếm

// @desc    Lấy danh sách Độ hiếm để nạp vào ô Dropdown chọn nhanh của Frontend
// @route   GET /api/products/rarities
const getRarities = async (req, res) => {
    try {
        const rarities = await Rarity.findAll({ 
            attributes: ['id', 'name'],
            order: [['id', 'ASC']]
        });
        res.json(rarities);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách độ hiếm: ' + error.message });
    }
};

// @desc    Lấy tất cả sản phẩm + Tích hợp Tìm kiếm & Lọc nâng cao theo ID bảng mới
// @route   GET /api/products
const getProducts = async (req, res) => {
    try {
        const { keyword, categoryId, gameType, rarityId } = req.query;
        let whereClause = {};

        // 1. Tính năng Tìm kiếm theo tên (Hỗ trợ không phân biệt hoa thường qua iLike)
        if (keyword) {
            whereClause.name = {
                [Op.iLike]: `%${keyword}%`
            };
        }

        // 2. Lọc theo Khóa ngoại categoryId (Bảng Categories mới) thay vì chuỗi chữ
        if (categoryId) {
            whereClause.categoryId = categoryId;
        }

        // 3. Lọc theo Tựa Game (gameType)
        if (gameType) {
            whereClause.gameType = gameType;
        }

        // 4. Lọc bổ sung theo Khóa ngoại rarityId (Bảng Rarities mới) nếu Frontend yêu cầu
        if (rarityId) {
            whereClause.rarityId = rarityId;
        }

        // Thực hiện truy vấn đồng thời nạp kèm (Join) thông tin từ bảng Danh mục & Độ hiếm
        const products = await Product.findAll({
            where: whereClause,
            include: [
                { model: Category, as: 'CategoryData', attributes: ['id', 'name'] },
                { model: Rarity, as: 'RarityData', attributes: ['id', 'name'] }
            ],
            order: [['createdAt', 'DESC']] // Sản phẩm mới tạo đưa lên đầu
        });

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách sản phẩm: ' + error.message });
    }
};

// @desc    Lấy chi tiết một sản phẩm theo ID (Kèm thông tin danh mục, độ hiếm, và toàn bộ reviews)
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id, {
            include: [
                {
                    model: Category,
                    as: 'CategoryData'
                },
                {
                    model: Rarity,
                    as: 'RarityData'
                },
                {
                    model: Review,
                    as: 'reviews', // Khớp chuẩn xác với alias 'reviews' khai báo tại server.js
                    include: [
                        {
                            model: User,
                            as: 'UserData', // Lấy thông tin User để hiển thị tên người đánh giá ở Frontend
                            attributes: ['name'] 
                        }
                    ]
                }
            ]
        });

        if (!product) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
        }

        res.json(product);
    } catch (error) {
        console.error("Lỗi lấy chi tiết sản phẩm tại Controller:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi tải chi tiết sản phẩm: " + error.message });
    }
};

// @desc    Thêm sản phẩm mới (Admin) - Lưu trực tiếp ID liên kết xuống DB
// @route   POST /api/products
const createProduct = async (req, res) => {
    try {
        const { name, image, gameType, categoryId, rarityId, price, countInStock, description } = req.body;

        const product = await Product.create({
            name,
            image,
            gameType,
            categoryId: categoryId || null, 
            rarityId: rarityId || null,
            price,
            countInStock,
            description
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi thêm sản phẩm: ' + error.message });
    }
};

// @desc    Cập nhật thông tin sản phẩm (Admin)
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);

        if (product) {
            product.name = req.body.name || product.name;
            product.image = req.body.image || product.image;
            product.gameType = req.body.gameType || product.gameType;
            
            product.categoryId = req.body.categoryId !== undefined ? req.body.categoryId : product.categoryId;
            product.rarityId = req.body.rarityId !== undefined ? req.body.rarityId : product.rarityId;
            
            product.price = req.body.price !== undefined ? req.body.price : product.price;
            product.countInStock = req.body.countInStock !== undefined ? req.body.countInStock : product.countInStock;
            product.description = req.body.description || product.description;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Không tìm thấy sản phẩm để cập nhật!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi sửa sản phẩm: ' + error.message });
    }
};

// @desc    Xóa sản phẩm (Admin)
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (product) {
            await product.destroy();
            res.json({ message: 'Đã xóa sản phẩm thành công khỏi hệ thống!' });
        } else {
            res.status(404).json({ message: 'Sản phẩm không tồn tại để xóa!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa sản phẩm: ' + error.message });
    }
};

// @desc    Tạo đánh giá mới cho sản phẩm
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const productId = req.params.id;
        
        const userId = req.user ? req.user.id : (req.body.userId || 1);

        if (!comment || !rating) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ mức sao và nội dung bình luận!" });
        }

        const newReview = await Review.create({
            rating: Number(rating),
            comment: comment,
            productId: Number(productId),
            userId: Number(userId)
        });

        res.status(201).json({
            message: "Gửi đánh giá thành công! 🎉",
            review: newReview
        });
    } catch (error) {
        console.error("Lỗi tạo đánh giá tại Controller:", error);
        res.status(500).json({ message: "Lỗi hệ thống không thể lưu đánh giá!" });
    }
};


const getCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            attributes: ['id', 'name'], // Lấy ra id và name tương tự bảng Rarity
            order: [['id', 'ASC']]      // Sắp xếp ID từ nhỏ đến lớn
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách danh mục: ' + error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    getCategories,
    deleteProduct,
    getRarities,
    createProductReview
};