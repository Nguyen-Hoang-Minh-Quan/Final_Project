const { Order, OrderItem } = require('../models/Order');
const Product = require('../models/Product');
const { sequelize } = require('../config/db');

// @desc    Tạo đơn hàng mới + Tự động tính tiền + Tự động trừ kho (Inventory Control)
// @route   POST /api/orders
const addOrderItems = async (req, res) => {
    const { orderItems, address, city, phone, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ message: 'Đơn hàng trống, không có sản phẩm nào!' });
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
                return res.status(404).json({ message: `Sản phẩm ID ${item.productId} không tồn tại!` });
            }

            // 🌟 PRE-CHECK KHO: Nếu số lượng yêu cầu lớn hơn số lượng trong kho, chặn ngay lập tức
            if (product.countInStock < item.qty) {
                await t.rollback();
                return res.status(400).json({ 
                    message: `Sản phẩm "${product.name}" vừa bị người khác mua hết hoặc không đủ số lượng! (Còn lại: ${product.countInStock})` 
                });
            }

            calculatedTotalPrice += Number(product.price) * item.qty;

            // 🌟 TRỪ KHO AN TOÀN
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
            isPaid: paymentMethod === 'COD' ? false : true
        }, { transaction: t });

        const finalOrderItems = itemsToCreate.map(item => ({
            ...item,
            orderId: order.id
        }));
        await OrderItem.bulkCreate(finalOrderItems, { transaction: t });

        await t.commit();
        res.status(201).json({ message: 'Đặt hàng thành công!', orderId: order.id });

    } catch (error) {
        if (!t.finished) await t.rollback();
        res.status(500).json({ message: 'Lỗi hệ thống khi đặt hàng: ' + error.message });
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
                return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này!' });
            }
            res.json(order);
        } else {
            res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
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
        res.status(500).json({ message: 'Lỗi hệ thống: ' + error.message });
    }
};

// @desc    Lấy toàn bộ đơn hàng (Chỉ dành cho Admin)
// @route   GET /api/orders/all
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            order: [['createdAt', 'DESC']]
        });
        return res.json(orders);
    } catch (error) {
        console.error(" LỖI TẠI GETALLORDERS BACKEND:", error);
        return res.status(500).json({ 
            message: 'Lỗi server khi lấy danh sách đơn hàng', 
            error: error.message 
        });
    }
};

// @desc    Cập nhật trạng thái đơn hàng + Đồng bộ dòng tiền thực (Admin)
// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Tìm đơn hàng kèm các items bên trong
        const order = await Order.findByPk(req.params.id, {
            include: [{ model: OrderItem, as: 'orderItems' }],
            transaction: t
        });
        
        if (!order) {
            await t.rollback();
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
        }
        
        const oldStatus = order.status;
        const newStatus = req.body.status;
        
        // 🌟 LOGIC HOÀN KHO (STOCK ROLLBACK) KHI HỦY ĐƠN
        // Nếu đơn hàng chưa hủy nay chuyển sang 'Đã hủy'
        if (newStatus === 'Đã hủy' && oldStatus !== 'Đã hủy') {
            for (const item of order.orderItems) {
                const product = await Product.findByPk(item.productId, { transaction: t });
                if (product) {
                    product.countInStock += item.qty; // Cộng trả số lượng lại vào kho
                    await product.save({ transaction: t });
                }
            }
        }
        
        // Ngược lại, nếu Admin lỡ bấm 'Đã hủy' nhưng muốn khôi phục lại thành 'Chờ xử lý'/'Đang giao'
        if (oldStatus === 'Đã hủy' && newStatus !== 'Đã hủy') {
            for (const item of order.orderItems) {
                const product = await Product.findByPk(item.productId, { transaction: t });
                if (product) {
                    if (product.countInStock < item.qty) {
                        await t.rollback();
                        return res.status(400).json({ message: `Không thể khôi phục đơn! Sản phẩm "${product.name}" trong kho không đủ để trừ lại.` });
                    }
                    product.countInStock -= item.qty; // Trừ lại kho
                    await product.save({ transaction: t });
                }
            }
        }

        // Cập nhật trạng thái và dòng tiền như cũ của Quân
        order.status = newStatus;
        if (newStatus === 'Đã giao') {
            order.isPaid = true;
        } else {
            order.isPaid = false; 
        }
        
        await order.save({ transaction: t });
        await t.commit();
        
        res.json({ message: 'Cập nhật trạng thái đơn hàng thành công!', order });
    } catch (error) {
        if (!t.finished) await t.rollback();
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái: ' + error.message });
    }
};

// @desc    Lấy thống kê doanh thu và biểu đồ hàng ngày (Admin)
// @route   GET /api/orders/stats
const getOrderStats = async (req, res) => {
    try {
        // 🌟 BƯỚC 1: SỬA LOGIC DOANH THU - Chỉ lấy đơn thực sự ĐÃ GIAO THÀNH CÔNG
        const orders = await Order.findAll({
            where: {
                status: 'Đã giao' // Nghiêm ngặt: Phải giao thành công mới tính doanh thu thực thu
            },
            attributes: ['totalPrice', 'createdAt'],
            // 🌟 BƯỚC 2: SỬA LỖI ĐẢO NGÀY - Sắp xếp tăng dần theo mốc thời gian thực ngay từ Database
            order: [['createdAt', 'ASC']] 
        });

        let totalRevenue = 0;
        
        // Dùng Map hoặc Object để nhóm tiền theo ngày
        const salesByDate = {};

        orders.forEach(order => {
            const price = Number(order.totalPrice || 0);
            totalRevenue += price;

            const dateObj = new Date(order.createdAt);
            // Định dạng ngày hiển thị trên biểu đồ trục X (Ví dụ: 17/5, 28/5)
            const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

            // Vì database đã được ORDER BY 'createdAt' ASC, các ngày đẩy vào đây sẽ tự động theo thứ tự tuyến tính từ cũ đến mới
            if (salesByDate[formattedDate]) {
                salesByDate[formattedDate] += price;
            } else {
                salesByDate[formattedDate] = price;
            }
        });

        // Chuyển đổi dữ liệu sang mảng cho Recharts
        const dailySales = Object.keys(salesByDate).map(date => ({
            date,
            sales: salesByDate[date]
        }));

        res.json({
            totalRevenue,
            orderCount: orders.length, // Đếm chính xác số đơn giao thành công
            dailySales // Trả về mảng đã tự động chuẩn hóa thứ tự thời gian
        });

    } catch (error) {
        console.error("LỖI TẠI GETORDERSTATS BACKEND:", error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tính doanh thu: ' + error.message });
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
                as: 'Order', // 🌟 SỬA TẠI ĐÂY: Đổi 'order' thành 'Order' viết hoa để khớp với định nghĩa association
                where: { status: 'Đã giao' }, 
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

        // Định dạng dữ liệu sạch để gửi về Frontend
        const formattedProducts = topProducts.map(item => ({
            productId: item.productId,
            name: item.name,
            image: item.image,
            price: item.price,
            totalSold: parseInt(item.totalSold || 0, 10)
        }));

        res.json(formattedProducts);
    } catch (error) {
        console.error("LỖI CHI TIẾT TẠI GETTOPPRODUCTS:", error);
        res.status(500).json({ message: 'Lỗi lấy top sản phẩm: ' + error.message });
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