const { Order, OrderItem } = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { sequelize } = require('../config/db');

// @desc    Tạo đơn hàng mới + Tự động tính tiền + Tự động trừ kho (Inventory Control)
// @route   POST /api/orders
const addOrderItems = async (req, res) => {
    const { orderItems, address, city, phone, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ message: 'The order is empty; there are no products!' });
    }

    const t = await sequelize.transaction();

    try {
        let calculatedTotalPrice = 0;
        const itemsToCreate = [];

        for (const item of orderItems) {
            // Sử dụng lock để tránh việc 2 user tranh chấp mua cùng 1 thẻ bài tại 1 thời điểm
            const product = await Product.findByPk(item.productId, { 
                transaction: t,
                lock: t.LOCK.UPDATE 
            });

            if (!product) {
                await t.rollback();
                return res.status(404).json({ message: `Product ID ${item.productId} does not exist!` });
            }

            //PRE-CHECK KHO: Nếu số lượng yêu cầu lớn hơn số lượng trong kho, chặn ngay lập tức
            if (product.countInStock < item.qty) {
                await t.rollback();
                return res.status(400).json({ 
                    message: `Product "${product.name}" is out of stock or insufficient quantity! (Available: ${product.countInStock})` 
                });
            }

            calculatedTotalPrice += Number(product.price) * item.qty;

            // TRỪ KHO AN TOÀN
            product.countInStock -= item.qty;
            await product.save({ transaction: t });

            itemsToCreate.push({
                productId: product.id,
                name: product.name,
                qty: item.qty,
                image: product.image,
                price: product.price
            });
        }

        const order = await Order.create({
            userId: req.user.id,
            address,
            city,
            phone,
            paymentMethod,
            totalPrice: calculatedTotalPrice,
            isPaid: paymentMethod === 'COD' ? false : true,
            status: 'Pending' // Mặc định đơn mới là Pending
        }, { transaction: t });

        const finalOrderItems = itemsToCreate.map(item => ({
            ...item,
            orderId: order.id
        }));
        await OrderItem.bulkCreate(finalOrderItems, { transaction: t });

        await t.commit();
        res.status(201).json({ message: 'Order placed successfully!', orderId: order.id });

    } catch (error) {
        if (!t.finished) await t.rollback();
        res.status(500).json({ message: 'System error while placing order: ' + error.message });
    }
};

// @desc    Lấy chi tiết một đơn hàng kèm theo danh sách sản phẩm bên trong nó
// @route   GET /api/orders/:id
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [{ model: OrderItem, as: 'orderItems' }]
        });

        if (order) {
            if (order.userId !== req.user.id && !req.user.isAdmin) {
                return res.status(403).json({ message: 'You do not have permission to view this order!' });
            }
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Lấy lịch sử đơn hàng của chính người dùng đang đăng nhập
// @route   GET /api/orders/myorders
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({ 
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'System error: ' + error.message });
    }
};

// @desc    Lấy toàn bộ đơn hàng kèm thông tin tài khoản khách hàng (Chỉ dành cho Staff/Admin)
// @route   GET /api/orders/all
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            // Join với bảng User qua alias 'UserData' (đã khai báo trong server.js) để lấy tên tài khoản
            include: [
                {
                    model: User,
                    as: 'UserData',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        return res.json(orders);
    } catch (error) {
        console.error(" ERROR IN GETALLORDERS BACKEND:", error);
        return res.status(500).json({ 
            message: 'Server error when fetching order list', 
            error: error.message 
        });
    }
};

// @desc    Cập nhật trạng thái đơn hàng + Đồng bộ dòng tiền thực (Admin)
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [{ model: OrderItem, as: 'orderItems' }],
            transaction: t
        });
        
        if (!order) {
            await t.rollback();
            return res.status(404).json({ message: 'Order not found!' });
        }
        
        const oldStatus = order.status;
        const newStatus = req.body.status; // Nhận trạng thái tiếng Anh từ frontend (ví dụ: Delivered, Cancelled, Pending, Shipping)
        
        // PRE-CHECK KHO: Nếu số lượng yêu cầu lớn hơn số lượng trong kho, chặn ngay lập tức
        if (newStatus === 'Cancelled' && oldStatus !== 'Cancelled') {
            for (const item of order.orderItems) {
                const product = await Product.findByPk(item.productId, { transaction: t });
                if (product) {
                    product.countInStock += item.qty; // Cộng trả số lượng lại vào kho
                    await product.save({ transaction: t });
                }
            }
        }
        
        // Ngược lại, nếu khôi phục từ trạng thái 'Cancelled' sang trạng thái khác
        if (oldStatus === 'Cancelled' && newStatus !== 'Cancelled') {
            for (const item of order.orderItems) {
                const product = await Product.findByPk(item.productId, { transaction: t });
                if (product) {
                    if (product.countInStock < item.qty) {
                        await t.rollback();
                        return res.status(400).json({ message: `Cannot restore order! Product "${product.name}" in stock is insufficient.` });
                    }
                    product.countInStock -= item.qty; // Trừ lại kho
                    await product.save({ transaction: t });
                }
            }
        }
        
        // Cập nhật trạng thái và dòng tiền
        order.status = newStatus;
        if (newStatus === 'Delivered') {
            order.isPaid = true;
        } else {
            order.isPaid = false; 
        }
        
        await order.save({ transaction: t });
        await t.commit();
        
        res.json({ message: 'Order status updated successfully!', order });
    } catch (error) {
        if (!t.finished) await t.rollback();
        console.error("ERROR IN UPDATEORDERSTATUS:", error);
        res.status(500).json({ message: 'Server error when updating order status: ' + error.message });
    }
};

// @desc    Lấy thống kê doanh thu và biểu đồ hàng ngày (Admin)
// @route   GET /api/orders/stats
const getOrderStats = async (req, res) => {
    try {
        // Chỉ lấy đơn thực sự ĐÃ GIAO THÀNH CÔNG ('Delivered')
        const orders = await Order.findAll({
            where: {
                status: 'Delivered' 
            },
            attributes: ['totalPrice', 'createdAt'],
            order: [['createdAt', 'ASC']] 
        });

        let totalRevenue = 0;
        const salesByDate = {};

        orders.forEach(order => {
            const price = Number(order.totalPrice || 0);
            totalRevenue += price;

            const dateObj = new Date(order.createdAt);
            const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

            if (salesByDate[formattedDate]) {
                salesByDate[formattedDate] += price;
            } else {
                salesByDate[formattedDate] = price;
            }
        });

        const dailySales = Object.keys(salesByDate).map(date => ({
            date,
            sales: salesByDate[date]
        }));

        res.json({
            totalRevenue,
            orderCount: orders.length,
            dailySales 
        });

    } catch (error) {
        console.error("ERROR IN GETORDERSTATS BACKEND:", error);
        res.status(500).json({ message: 'System error when calculating revenue: ' + error.message });
    }
};

const getTopProducts = async (req, res) => {
    try {
        const topProducts = await OrderItem.findAll({
            attributes: [
                'productId',
                'name',
                'image',
                'price',
                [sequelize.fn('SUM', sequelize.col('qty')), 'totalSold']
            ],
            include: [{
                model: Order,
                as: 'Order', 
                where: { status: 'Delivered' }, 
                attributes: [] 
            }],
            group: [
                'productId', 
                'OrderItem.id', 
                'OrderItem.name', 
                'OrderItem.image', 
                'OrderItem.price'
            ],
            order: [[sequelize.fn('SUM', sequelize.col('qty')), 'DESC']],
            limit: 5,
            raw: true
        });

        const formattedProducts = topProducts.map(item => ({
            productId: item.productId,
            name: item.name,
            image: item.image,
            price: item.price,
            totalSold: parseInt(item.totalSold || 0, 10)
        }));

        res.json(formattedProducts);
    } catch (error) {
        console.error("DETAILED ERROR AT GETTOPPRODUCTS:", error);
        res.status(500).json({ message: 'Server error when fetching top products: ' + error.message });
    }
};

module.exports = { 
    addOrderItems, 
    getOrderById, 
    getMyOrders, 
    getAllOrders, 
    updateOrderStatus, 
    getOrderStats, 
    getTopProducts
};