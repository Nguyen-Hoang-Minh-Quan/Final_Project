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
        return 'The password must be at least 6 characters long!';
    }
    if (!/[A-Z]/.test(password)) {
        return 'The password must contain at least one uppercase letter (A-Z)!';
    }
    if (!/[!@#$%^&*(),.?":{}|<>_~-]/.test(password)) {
        return 'The password must contain at least one special character (!@#$%^&*...)!';
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
            return res.status(400).json({ message: 'This email has already been registered in the system!' });
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
            return res.status(400).json({ message: 'Please provide your email address!' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'This email has not been registered in the TCG Shop system!' });
        }

        // Tạo mã OTP 6 số ngẫu nhiên
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOtp = otp;
        user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút hiệu lực
        await user.save();

        // Gửi email qua nodemailer
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                connectionTimeout: 6000, // Tối đa 6s tránh treo request
                greetingTimeout: 6000,
                socketTimeout: 6000
            });

            const mailOptions = {
                from: `"TCG Shop Support" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'TCG Shop - Verification Code for Password Reset (OTP)',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
                        <div style="text-align: center; margin-bottom: 25px;">
                            <h1 style="color: #dc3545; margin: 0; font-size: 26px; letter-spacing: 1px;">TCG SHOP</h1>
                            <p style="color: #718096; margin-top: 5px; font-size: 14px;">Official Pokémon Card Shop</p>
                        </div>
                        <p style="font-size: 15px; color: #2d3748;">Hello <strong>${user.name}</strong>,</p>
                        <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                            We have received a request to reset the password for the account associated with this email address.
                            Please use the verification code (OTP) below to complete the process. If you did not request a password reset, please ignore this email.
                        </p>
                        <p style="font-size: 15px; color: #4a5568; line-height: 1.6;">
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #dc3545; background: #fff5f5; padding: 14px 28px; border-radius: 8px; border: 2px dashed #feb2b2;">
                                ${otp}
                            </span>
                        </div>
                        <p style="color: #718096; font-size: 13px; line-height: 1.5;">
                            This verification code is valid for <strong>10 minutes</strong>.<br/>
                            To protect your account, never share this code with anyone.
                        </p>
                        <hr style="border: none; border-top: 1px solid #edf2f7; margin: 25px 0;" />
                        <p style="text-align: center; color: #a0aec0; font-size: 12px; margin: 0;">
                            If you did not request this, please ignore this email or change your password to enhance security.
                        </p>
                    </div>
                `
            };

            try {
                await transporter.sendMail(mailOptions);
                return res.json({ 
                    message: `The verification code has been sent to your email ${user.email}. Please check your inbox (or Spam folder)!` 
                });
            } catch (mailError) {
                console.error('[MAIL ERROR] SMTP error (often caused by the Render cloud server blocking the port used for sending emails):', mailError.message);
                // Fallback an toàn: Không quăng lỗi 500 mà trả về mã OTP để người dùng tiếp tục hoàn tất đổi mật khẩu
                return res.json({ 
                    message: `The verification code for your account is: ${otp} (Note: The cloud server Render blocks the SMTP port for Gmail, so please use this code to reset your password immediately).` 
                });
            }
        } else {
            console.warn(`[TCG SHOP AUTH] EMAIL_USER or EMAIL_PASS has not been configured. OTP code generated: ${otp}`);
            return res.json({ 
                message: `The verification code for your account is: ${otp} (Note: The cloud server Render blocks the SMTP port for Gmail, so please use this code to reset your password immediately).` 
            });
        }
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ message: 'Error sending verification email: ' + error.message });
    }
};

// @desc    Xác thực OTP và đặt lại mật khẩu mới
// @route   POST /api/auth/reset-password-otp
const resetPasswordWithOtp = async (req, res) => {
    const { email, otp, password } = req.body;

    try {
        if (!email || !otp || !password) {
            return res.status(400).json({ message: 'Please fill in all fields: email, OTP code, and new password!' });
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'Account with this email does not exist!' });
        }

        if (!user.resetOtp || user.resetOtp.trim() !== String(otp).trim()) {
            return res.status(400).json({ message: 'The verification OTP code is incorrect!' });
        }

        if (!user.resetOtpExpires || new Date() > new Date(user.resetOtpExpires)) {
            return res.status(400).json({ message: 'The verification OTP code has expired! Please request a new code.' });
        }

        // Cập nhật mật khẩu mới (hook beforeUpdate sẽ tự động mã hóa bằng bcrypt)
        user.password = password;
        user.resetOtp = null;
        user.resetOtpExpires = null;
        await user.save();

        return res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
    } catch (error) {
        console.error("Error in resetPasswordWithOtp:", error);
        return res.status(500).json({ message: 'System error while resetting password: ' + error.message });
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