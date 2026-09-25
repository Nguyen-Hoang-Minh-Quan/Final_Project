const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Đăng ký tài khoản mới
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'Email này đã được đăng ký sử dụng!' });
        }

        const user = await User.create({ name, email, password });

        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            role: user.role || (user.isAdmin ? 'Admin' : 'Customer'),
            phone: user.phone,
            address: user.address,
            birthday: user.birthday,
            gender: user.gender,
            token: generateToken(user.id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống khi đăng ký: ' + error.message });
    }
};

// @desc    Đăng nhập tài khoản
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (user && (await user.matchPassword(password))) {
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                role: user.role || (user.isAdmin ? 'Admin' : 'Customer'),
                phone: user.phone,
                address: user.address,
                birthday: user.birthday,
                gender: user.gender,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống khi đăng nhập: ' + error.message });
    }
};

// @desc    Cập nhật hồ sơ cá nhân
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
            user.address = req.body.address !== undefined ? req.body.address : user.address;
            user.birthday = req.body.birthday !== undefined ? req.body.birthday : user.birthday;
            user.gender = req.body.gender !== undefined ? req.body.gender : user.gender;

            const updatedUser = await user.save();

            res.json({
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                isAdmin: updatedUser.isAdmin,
                role: updatedUser.role || (updatedUser.isAdmin ? 'Admin' : 'Customer'),
                phone: updatedUser.phone,
                address: updatedUser.address,
                birthday: updatedUser.birthday,
                gender: updatedUser.gender,
                token: generateToken(updatedUser.id)
            });
        } else {
            res.status(404).json({ message: 'Không tìm thấy thông tin người dùng!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật hồ sơ: ' + error.message });
    }
};

// @desc    Lấy thông tin profile cá nhân
// @route   GET /api/auth/profile
const getUserProfile = async (req, res) => {
    if (req.user) {
        res.json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            isAdmin: req.user.isAdmin,
            role: req.user.role || (req.user.isAdmin ? 'Admin' : 'Customer'),
            phone: req.user.phone,
            address: req.user.address,
            birthday: req.user.birthday,
            gender: req.user.gender,
        });
    } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng!' });
    }
};

// @desc    Xử lý yêu cầu quên mật khẩu
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    const { email } = req.body; 
    try {
        const user = await User.findOne({ where: { email } });
        if (user) {
            const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ 
                message: `Hệ thống đã xác nhận tài khoản ${user.name}! Bạn có thể truy cập link này để đổi mật khẩu: http://localhost:3000/reset-password/${resetToken}` 
            });
        } else {
            res.status(404).json({ message: 'Email này không tồn tại trên hệ thống TCG Shop!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống: ' + error.message });
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(404).json({ message: 'Tài khoản không tồn tại hoặc đã bị xóa!' });
        }

        user.password = password;
        await user.save();

        return res.json({ message: 'Mật khẩu của bạn đã được cập nhật thành công!' });
    } catch (error) {
        console.error("❌ LỖI ĐẶT LẠI MẬT KHẨU:", error);
        return res.status(400).json({ message: 'Liên kết xác thực đã hết hạn hoặc không hợp lệ!' });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['id', 'ASC']]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách user: ' + error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng này!' });
        }

        user.role = role;
        user.isAdmin = (role === 'Admin');
        await user.save();

        res.json({ message: `Đã cập nhật vai trò của ${user.name} thành ${role}`, user });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật vai trò: ' + error.message });
    }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile, forgotPassword, resetPassword, getUsers, updateUserRole };