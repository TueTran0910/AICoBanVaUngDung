const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.post('/api/analyze', async (req, res) => {
    // Nhận thêm thông tin userProfile từ React
    const { imageBase64, userProfile } = req.body; 
    try {
        const aiResponse = await axios.post('http://127.0.0.1:5001/process', { 
            image: imageBase64,
            userProfile: userProfile // Chuyển tiếp sang Python
        });
        res.json(aiResponse.data);
    } catch (error) {
        console.error("Lỗi kết nối AI:", error.message);
        res.status(500).json({ error: "Bộ não AI đang bận!" });
    }
});

app.listen(5000, () => console.log('Backend Node.js đang chạy tại port 5000'));