const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose'); // Đưa mongoose lên trên cùng cho gọn
require('dotenv').config();

const app = express();
app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- PHẦN KẾT NỐI DATABASE ---

// Sử dụng biến môi trường từ file .env để bảo mật và dùng chung Cloud
const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Đã kết nối MongoDB Cloud thành công!'))
    .catch(err => {
        console.error('❌ Lỗi kết nối Cloud:', err.message);
        // Lưu ý: Kiểm tra lại mật khẩu hoặc IP Access trên Atlas nếu bị lỗi này
    });

// Định nghĩa khung dữ liệu (Schema)
const productSchema = new mongoose.Schema({
    product_name: String,
    stats: {
        calories: String,
        sugar: String,
        protein: String,
        fat: String,
        carb: String
    },
    health_score: Number,
    short_advice: [String],
    alternatives: [String],
    userProfile: {
        gender: String,
        age: Number,
        weight: Number,
        height: Number
    },
    createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// --- PHẦN API ---

app.post('/api/analyze', async (req, res) => {
    const { imageBase64, userProfile } = req.body;
    try {
        // 1. Gửi sang Python (AI Service)
        const aiResponse = await axios.post('http://127.0.0.1:5001/process', {
            image: imageBase64,
            userProfile: userProfile
        });

        // 2. Lấy dữ liệu AI trả về
        const resultFromAI = aiResponse.data;

        // 3. Lưu vào MongoDB Cloud
        const newRecord = new Product({
            ...resultFromAI,
            userProfile: userProfile
        });

        await newRecord.save();
        console.log("💾 Đã lưu dữ liệu mới vào Cloud!");

        res.json(resultFromAI);
    } catch (error) {
        console.error("Lỗi API:", error.message);
        res.status(500).json({ error: "Lỗi kết nối hoặc lưu dữ liệu!" });
    }
});

app.listen(5000, () => console.log('🚀 Backend Node.js đang chạy tại port 5000'));