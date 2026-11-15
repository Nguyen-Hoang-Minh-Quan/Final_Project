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
        res.status(500).json({ message: 'Error fetching blogs: ' + error.message });
    }
};

// Lấy chi tiết bài viết theo Slug
const getBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog.findOne({
            where: { slug: req.params.slug },
            include: [{ model: User, as: 'AuthorData', attributes: ['id', 'name'] }]
        });
        if (!blog) return res.status(404).json({ message: 'Blog not found!' });
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Đăng bài viết mới (Staff/Admin)
const createBlog = async (req, res) => {
    try {
        const { title, summary, content, image } = req.body;
        
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

        if (authorId) {
            try {
                await StaffLog.create({
                    staffId: authorId,
                    action: `Post a new article #${blog.id}`,
                    details: `Title: ${title}`
                });
            } catch (logErr) {
                console.error("Cannot write StaffLog when posting blog:", logErr.message);
            }
        }

        res.status(201).json(blog);
    } catch (error) {
        console.error("Error creating blog:", error);
        res.status(500).json({ message: 'Error creating blog: ' + error.message });
    }
};

const updateBlog = async (req, res) => {
    try {
        const { title, summary, content, image } = req.body;
        const blog = await Blog.findByPk(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found!' });
        }

        let slug = blog.slug;
        if (title && title !== blog.title) {
            const cleanTitle = title
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, "-")
                .replace(/-+/g, "-");
            slug = `${cleanTitle}-${Date.now()}`;
        }

        blog.title = title || blog.title;
        blog.slug = slug;
        blog.summary = summary !== undefined ? summary : blog.summary;
        blog.content = content || blog.content;
        blog.image = image !== undefined ? image : blog.image;

        await blog.save();

        const authorId = req.user ? req.user.id : null;
        if (authorId) {
            try {
                await StaffLog.create({
                    staffId: authorId,
                    action: `Update blog #${blog.id}`,
                    details: `Title: ${blog.title}`
                });
            } catch (logErr) {
                console.error("Cannot write StaffLog when updating blog:", logErr.message);
            }
        }

        res.json({ message: 'Blog updated successfully!', blog });
    } catch (error) {
        console.error("Error updating blog:", error);
        res.status(500).json({ message: 'Error updating blog: ' + error.message });
    }
};

// Xóa bài viết
const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found!' });

        await blog.destroy();
        res.json({ message: 'Blog deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting blog: ' + error.message });
    }
};

module.exports = { getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog };