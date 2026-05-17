const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./API/config/db');

// Import Routes
const authRoutes = require('./API/routes/authRoutes');
const cardRoutes = require('./API/routes/cardRoutes');
const orderRoutes = require('./API/routes/orderRoutes');
const aiRoutes = require('./API/routes/aiRoutes');

dotenv.config();
connectDB();

const app = express();

// Middlewares - QUAN TRỌNG: Phải đặt trên các Route
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Cổng API
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
    res.send('--- [SERVER] TCG SHOP API IS RUNNING ---');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`--- [READY] Server đang chạy tại port ${PORT} ---`);
});