const express = require('express');
const router = express.Router();
const { getBlogs, getBlogBySlug, createBlog, deleteBlog } = require('../controllers/blogController');
const { protect, staffOrAdmin } = require('../middleware/authMiddleware');

router.get('/', getBlogs);
router.get('/:slug', getBlogBySlug);
router.post('/', protect, staffOrAdmin, createBlog);
router.delete('/:id', protect, staffOrAdmin, deleteBlog);

module.exports = router;