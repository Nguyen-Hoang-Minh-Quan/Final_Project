const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Khởi tạo thực thể Sequelize kết nối PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Tắt log câu lệnh SQL thô cho sạch terminal
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Bắt buộc phải có khi kết nối Cloud Neon
    },
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`--- [SUCCESS] PostgreSQL Connected (Neon Cloud) ---`);
  } catch (error) {
    console.error(`--- [ERROR] PostgreSQL Connection Failed: ${error.message} ---`);
    process.exit(1);
  }
};

module.exports = { connectDB, sequelize };