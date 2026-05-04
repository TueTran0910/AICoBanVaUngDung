const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.post('/api/analyze', async (req, res) => {
    const { imageBase64, userProfile } = req.body;
    try {
        // Gửi sang Python (AI Service)
        const aiResponse = await axios.post('http://127.0.0.1:5001/process', {
            image: imageBase64,
            userProfile: userProfile
        });

        // Lấy dữ liệu AI trả về và lưu vào MongoDB
        const resultFromAI = aiResponse.data;
        const newRecord = new Product({
            ...resultFromAI,
            userProfile: userProfile // Lưu luôn thông tin thể trạng lúc quét
        });

        await newRecord.save(); // Lệnh này sẽ tạo DB và Table (Collection) ngay lập tức

        res.json(resultFromAI);
    } catch (error) {
        res.status(500).json({ error: "Lỗi kết nối hoặc lưu dữ liệu!" });
    }
});

app.listen(5000, () => console.log('Backend Node.js đang chạy tại port 5000'));
const mongoose = require('mongoose');

// 1. Kết nối - MongoDB sẽ tự tạo DB 'AICoBan_DB' nếu chưa có
mongoose.connect('mongodb://localhost:27017/AICoBan_DB')
    .then(() => console.log('Kết nối MongoDB thành công!'))
    .catch(err => console.error('Lỗi kết nối:', err));

// 2. Định nghĩa khung dữ liệu (Schema)
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

// 3. Tạo Model
const Product = mongoose.model('Product', productSchema);