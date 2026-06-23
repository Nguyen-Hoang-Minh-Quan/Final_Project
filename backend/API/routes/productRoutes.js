const express = require('express');
const router = express.Router();
const { 
    getProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    getRarities,
    createProductReview,
    getCategories
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/rarities', getRarities);
router.get('/categories', getCategories)
router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.post('/:id/reviews', protect, createProductReview);

module.exports = router;