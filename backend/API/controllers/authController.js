const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Kiểm tra độ mạnh mật khẩu (bảo mật: >= 6 ký tự, có in hoa, có ký tự đặc biệt)
const validatePassword = (password) => {
    if (!password || password.length < 6) {
        return 'Mật khẩu phải có độ dài tối thiểu 6 ký tự!';
    }
    if (!/[A-Z]/.test(password)) {
        return 'Mật khẩu phải chứa ít nhất 1 chữ cái in hoa (A-Z)!';
    }
    if (!/[!@#$%^&*(),.?":{}|<>_~-]/.test(password)) {
        return 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*...)!';
    }
    return null;
};

// @desc    Đăng ký tài khoản mới
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'Email này đã được đăng ký trong hệ thống!' });
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

// @desc    Xử lý yêu cầu quên mật khẩu (Tạo mã OTP 6 số và gửi qua email)
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    const { email } = req.body; 
    try {
        if (!email) {
            return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ email!' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Email này chưa được đăng ký trong hệ thống TCG Shop!' });
        }

        // Tạo mã OTP 6 số ngẫu nhiên
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOtp = otp;
        user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút hiệu lực
        await user.save();

        // Gửi email qua nodemailer
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: `"TCG Shop Support" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'TCG Shop - Mã xác thực khôi phục mật khẩu (OTP)',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                        <div style="text-align: center; margin-bottom: 25px;">
                            <h1 style="color: #dc3545; margin: 0; font-size: 26px; letter-spacing: 1px;">TCG SHOP</h1>
                            <p style="color: #718096; margin-top: 5px; font-size: 14px;">Hệ Thống Thẻ Bài Pokémon Chính Hãng</p>
                        </div>
                        <p style="font-size: 15px; color: #2d3748;">Xin chào <strong>${user.name}</strong>,</p>
                        <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                            Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này.
                            Vui lòng sử dụng mã xác thực (OTP) bên dưới để hoàn tất:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #dc3545; background: #fff5f5; padding: 14px 28px; border-radius: 8px; border: 2px dashed #feb2b2;">
                                ${otp}
                            </span>
                        </div>
                        <p style="color: #718096; font-size: 13px; line-height: 1.5;">
                            ⏱️ Mã xác thực này có hiệu lực trong <strong>10 phút</strong>.<br/>
                            🔒 Để bảo mật tài khoản, tuyệt đối không chia sẻ mã này cho bất kỳ ai.
                        </p>
                        <hr style="border: none; border-top: 1px solid #edf2f7; margin: 25px 0;" />
                        <p style="text-align: center; color: #a0aec0; font-size: 12px; margin: 0;">
                            Nếu bạn không gửi yêu cầu này, xin vui lòng bỏ qua email hoặc đổi mật khẩu để tăng tính bảo mật.
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            return res.json({ 
                message: `Mã xác thực đã được gửi về email ${user.email}. Vui lòng kiểm tra hộp thư đến (hoặc hòm thư Spam)!` 
            });
        } else {
            console.warn(`[TCG SHOP AUTH] EMAIL_USER hoặc EMAIL_PASS chưa được cấu hình. Mã OTP tạo ra: ${otp}`);
            return res.json({ 
                message: `Mã xác thực OTP đã được tạo: ${otp} (Thời hạn 10 phút). Hãy cấu hình EMAIL_USER & EMAIL_PASS để gửi email thật.` 
            });
        }
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ message: 'Lỗi gửi email xác thực: ' + error.message });
    }
};

// @desc    Xác thực OTP và đặt lại mật khẩu mới
// @route   POST /api/auth/reset-password-otp
const resetPasswordWithOtp = async (req, res) => {
    const { email, otp, password } = req.body;

    try {
        if (!email || !otp || !password) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ email, mã OTP và mật khẩu mới!' });
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Tài khoản với email này không tồn tại!' });
        }

        if (!user.resetOtp || user.resetOtp.trim() !== String(otp).trim()) {
            return res.status(400).json({ message: 'Mã xác thực OTP không chính xác!' });
        }

        if (!user.resetOtpExpires || new Date() > new Date(user.resetOtpExpires)) {
            return res.status(400).json({ message: 'Mã xác thực OTP đã hết hạn! Vui lòng yêu cầu gửi lại mã mới.' });
        }

        // Cập nhật mật khẩu mới (hook beforeUpdate sẽ tự động mã hóa bằng bcrypt)
        user.password = password;
        user.resetOtp = null;
        user.resetOtpExpires = null;
        await user.save();

        return res.json({ message: 'Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới.' });
    } catch (error) {
        console.error("Error in resetPasswordWithOtp:", error);
        return res.status(500).json({ message: 'Lỗi hệ thống khi đổi mật khẩu: ' + error.message });
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

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

module.exports = { 
    registerUser, 
    loginUser, 
    getUserProfile, 
    updateUserProfile, 
    forgotPassword, 
    resetPassword, 
    resetPasswordWithOtp,
    getUsers, 
    updateUserRole 
};