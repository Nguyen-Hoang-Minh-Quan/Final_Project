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
            return res.status(400).json({ message: 'This email is already registered!' });
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
        res.status(500).json({ message: 'System error when registering: ' + error.message });
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
            res.status(401).json({ message: 'Incorrect email or password!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'System error when logging in: ' + error.message });
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
            res.status(404).json({ message: 'User not found!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error when updating profile: ' + error.message });
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
        res.status(404).json({ message: 'User not found!' });
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
                message: `System has confirmed account ${user.name}! You can visit this link to change your password: http://localhost:3000/reset-password/${resetToken}` 
            });
        } else {
            res.status(404).json({ message: 'This email does not exist in the TCG Shop system!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'System error: ' + error.message });
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(404).json({ message: 'Account not found or has been deleted!' });
        }

        user.password = password;
        await user.save();

        return res.json({ message: 'Your password has been updated successfully!' });
    } catch (error) {
        console.error("Error resetting password:", error);
        return res.status(400).json({ message: 'The verification link has expired or is invalid!' });
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
        res.status(500).json({ message: 'Error fetching user list: ' + error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        user.role = role;
        user.isAdmin = (role === 'Admin');
        await user.save();

        res.json({ message: `Updated role for ${user.name} to ${role}`, user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating role: ' + error.message });
    }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile, forgotPassword, resetPassword, getUsers, updateUserRole };