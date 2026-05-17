const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

router.post('/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        // 1. Kiểm tra xem có Key chưa
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: "Thiếu GEMINI_API_KEY trong .env" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        // 2. Gọi AI
        const result = await model.generateContent(`Bạn là chuyên gia về Pokémon TCG. Hãy trả lời câu hỏi này một cách chuyên nghiệp: ${prompt}`);
        const response = await result.response;
        const text = response.text();

        // 3. Trả về cho Frontend
        res.json({ text });
    } catch (error) {
        console.error("Lỗi AI Chi tiết:", error);
        res.status(500).json({ message: "AI đang bận, thử lại sau nhé!", error: error.message });
    }
});

module.exports = router;