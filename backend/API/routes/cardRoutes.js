const express = require('express');
const router = express.Router();
const Card = require('../models/Card');

// 1. Lấy tất cả thẻ
router.get('/', async (req, res) => {
  const cards = await Card.find({});
  res.json(cards);
});

// 2. ROUTE SEARCH PHẢI ĐẶT TRÊN ROUTE :ID (Quan trọng nhất nè Quân!)
router.get('/search', async (req, res) => {
    try {
        const keyword = req.query.keyword ? {
            name: {
                $regex: req.query.keyword,
                $options: 'i',
            },
        } : {};

        const cards = await Card.find({ ...keyword });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tìm kiếm!' });
    }
});

// 3. Thêm thẻ mới
router.post('/', async (req, res) => {
  const card = new Card(req.body);
  const createdCard = await card.save();
  res.status(201).json(createdCard);
});

// 4. Cập nhật thẻ (Phải nằm dưới /search)
router.put('/:id', async (req, res) => {
  const card = await Card.findById(req.params.id);
  if (card) {
    card.name = req.body.name || card.name;
    card.price = req.body.price || card.price;
    card.image = req.body.image || card.image;
    card.countInStock = req.body.countInStock !== undefined ? req.body.countInStock : card.countInStock;
    const updatedCard = await card.save();
    res.json(updatedCard);
  } else {
    res.status(404).json({ message: 'Không tìm thấy thẻ bài này' });
  }
});

// 5. Xóa thẻ
router.delete('/:id', async (req, res) => {
  await Card.findByIdAndDelete(req.params.id);
  res.json({ message: 'Đã xóa thẻ' });
});

module.exports = router;