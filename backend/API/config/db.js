const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Kiểm tra xem biến có tồn tại không trước khi kết nối
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI không tồn tại trong file .env");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`--- [SUCCESS] MongoDB Connected: ${conn.connection.host} ---`);
  } catch (error) {
    console.error(`--- [ERROR] MongoDB Connection Failed: ${error.message} ---`);
    process.exit(1);
  }
};

module.exports = connectDB;