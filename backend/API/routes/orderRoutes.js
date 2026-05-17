const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Card = require('../models/Card');
const { protect, admin } = require('../../middleware/authMiddleware');

// 1. Route POST: Tạo đơn hàng & Trừ kho
router.post('/', protect, async (req, res) => {
  try {
    const { orderItems, address, city, phone, totalPrice, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "Đơn hàng trống!" });
    }

    const order = new Order({
      user: req.user._id,
      orderItems,
      address,
      city,
      phone,
      totalPrice,
      paymentMethod,
    });

    const createdOrder = await order.save();

    // Logic trừ kho: Cập nhật số lượng của từng thẻ bài
    for (const item of orderItems) {
      await Card.findByIdAndUpdate(item.product, {
        $inc: { countInStock: -item.qty } 
      });
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: "Lỗi đặt hàng: " + error.message });
  }
});

// 2. Route GET: Thống kê doanh thu (Đặt trên các route :id để tránh trùng lặp)
router.get('/stats', protect, admin, async (req, res) => {
  try {
    // 1. Lấy tổng doanh thu và số đơn
    const generalStats = await Order.aggregate([
      { $match: { status: "Đã giao" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $toDouble: "$totalPrice" } },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // 2. Lấy dữ liệu theo ngày để vẽ biểu đồ
    const salesData = await Order.aggregate([
      { $match: { status: "Đã giao" } },
      {
        $group: {
          _id: { $dateToString: { format: "%d/%m", date: "$createdAt" } },
          sales: { $sum: { $toDouble: "$totalPrice" } },
          sortDate: { $first: "$createdAt" }
        }
      },
      { $sort: { sortDate: 1 } }, // Sắp xếp theo thứ tự thời gian
      {
        $project: {
          _id: 0,
          date: "$_id",
          sales: 1
        }
      }
    ]);

    const result = generalStats[0] || { totalRevenue: 0, orderCount: 0 };
    
    // Gửi kèm mảng dailySales về cho Frontend
    res.json({
      ...result,
      dailySales: salesData 
    });

  } catch (error) {
    res.status(500).json({ message: "Lỗi thống kê", error: error.message });
  }
});

// 3. Route GET: Lấy tất cả đơn hàng (Admin)
router.get('/', protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Route GET: Lịch sử mua hàng của User
router.get('/myorders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. Route PUT: Cập nhật trạng thái
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.status = req.body.status || order.status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 6. Route GET: Lấy đơn hàng theo User ID (Dành cho Admin xem lịch sử mua hàng của khách)
router.get('/user/:id', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;