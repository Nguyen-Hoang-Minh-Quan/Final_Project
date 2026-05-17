const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ĐĂNG KÝ (Register)
const registerUser = async (req, res) => {
    try {
        const { username, email, password, name, address, phone } = req.body;

        // 1. Kiểm tra xem user đã tồn tại chưa
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: "Username hoặc Email đã được sử dụng!" });
        }

        // 2. Mã hóa mật khẩu (Bảo mật cho đồ án)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Tạo user mới với đúng trường 'name'
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            name, // Đây là lý do nãy giờ bị lỗi, giờ đã fix chuẩn!
            address,
            phone
        });

        await newUser.save();
        res.status(201).json({ message: "Đăng ký thành công! Hãy đăng nhập." });
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server: " + error.message });
    }
};

// ĐĂNG NHẬP (Login)
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Tìm user theo email
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            // Tạo JWT Token (Để duy trì đăng nhập)
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                name: user.name,
                isAdmin: Boolean(user.isAdmin),
                token: token
            });
        } else {
            res.status(401).json({ message: "Email hoặc mật khẩu không chính xác!" });
        }
    } catch (error) {
        res.status(500).json({ message: "Lỗi Server: " + error.message });
    }
};

module.exports = { registerUser, loginUser };