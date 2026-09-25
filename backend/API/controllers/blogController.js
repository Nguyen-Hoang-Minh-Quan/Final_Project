const Blog = require('../models/Blog');
const User = require('../models/User');
const StaffLog = require('../models/StaffLog');

// Lấy danh sách bài viết
const getBlogs = async (req, res) => {
    try {
        const blogs = await Blog.findAll({
            include: [{ model: User, as: 'AuthorData', attributes: ['id', 'name', 'email'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tải bài viết: ' + error.message });
    }
};

// Lấy chi tiết bài viết theo Slug
const getBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog.findOne({
            where: { slug: req.params.slug },
            include: [{ model: User, as: 'AuthorData', attributes: ['id', 'name'] }]
        });
        if (!blog) return res.status(404).json({ message: 'Không tìm thấy bài viết!' });
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};

// Đăng bài viết mới (Staff/Admin)
const createBlog = async (req, res) => {
    try {
        const { title, summary, content, image } = req.body;
        
        // Chuẩn hóa Slug an toàn với tiếng Việt
        const cleanTitle = (title || 'blog')
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-");
            
        const uniqueSlug = `${cleanTitle}-${Date.now()}`;
        const authorId = req.user ? req.user.id : null;

        const blog = await Blog.create({
            title,
            slug: uniqueSlug,
            summary: summary || '',
            content,
            image: image || '',
            authorId
        });

        // Ghi log hoạt động nhân viên (Bọc catch riêng tránh dừng việc tạo bài viết)
        if (authorId) {
            try {
                await StaffLog.create({
                    staffId: authorId,
                    action: `Đăng bài viết mới #${blog.id}`,
                    details: `Tiêu đề: ${title}`
                });
            } catch (logErr) {
                console.error("⚠️ Không thể ghi StaffLog khi đăng blog:", logErr.message);
            }
        }

        res.status(201).json(blog);
    } catch (error) {
        console.error("❌ LỖI TẠO BÀI VIẾT:", error);
        res.status(500).json({ message: 'Lỗi tạo bài viết: ' + error.message });
    }
};

// Xóa bài viết
const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Bài viết không tồn tại!' });

        await blog.destroy();
        res.json({ message: 'Đã xóa bài viết!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa bài viết: ' + error.message });
    }
};

module.exports = { getBlogs, getBlogBySlug, createBlog, deleteBlog };