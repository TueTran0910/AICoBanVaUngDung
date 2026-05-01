import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import axios from 'axios';

function App() {
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [nutrition, setNutrition] = useState(null);

  // Lưu thông tin người dùng
  const [userProfile, setUserProfile] = useState({
    age: '20',
    weight: '60',
    height: '170',
    gender: 'Nam'
  });

  const handleInputChange = (e) => {
    setUserProfile({ ...userProfile, [e.target.name]: e.target.value });
  };

  const parseLocalData = (rawText) => {
    const cleanText = rawText.toLowerCase().replace(/,/g, '.');
    const findValue = (keywords, unit = "g") => {
      for (let kw of keywords) {
        const index = cleanText.indexOf(kw);
        if (index !== -1) {
          const chunk = cleanText.substring(index, index + 40);
          const match = chunk.match(/([≥>=?\d.,\s%]+)/);
          if (match) {
            let val = match[1].trim();
            return val.includes('%') ? val : val + unit;
          }
        }
      }
      return "N/A";
    };

    return {
      product_name: "Nhận diện nội bộ (Offline)",
      stats: {
        calories: findValue(['kcal', 'calo', 'energy', 'năng lượng', 'エネルギー', '열량'], ' kcal'),
        sugar: findValue(['sugar', 'đường', 'sucrose', '糖', '糖類'], 'g'),
        protein: findValue(['protein', 'đạm', 'protid', 'たんぱく質', '단백질'], 'g'),
        fat: findValue(['fat', 'béo', 'lipid', '脂質', '지방'], 'g'),
        calcium: findValue(['canxi', 'calcium', 'ca'], 'mg'),
        carb: findValue(['carb', 'hydrat', 'carbon', '炭水化物', '탄수화물'], 'g'),
      },
      health_score: "??",
      short_advice: ["Mất kết nối Internet hoặc hết API key - Đang dùng bộ lọc Regex", "Kết nối mạng để AI tư vấn chi tiết theo thể trạng"],
      alternatives: ["Cần kết nối mạng hoặc đổi API key để AI tư vấn món thay thế"], // Thêm cho chế độ Offline
      isOffline: true
    };
  };

  const getBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleScan = async () => {
    if (!imageFile) return alert("Chọn ảnh đã Tuệ ơi!");
    setLoading(true);
    setNutrition(null);
    setProgress(0);

    try {
      const base64String = await getBase64(imageFile);
      // Gửi kèm dữ liệu cá nhân sang Node.js
      const res = await axios.post('http://localhost:5000/api/analyze', 
        { imageBase64: base64String, userProfile: userProfile }, 
        { timeout: 35000 } 
      );
      setNutrition({ ...res.data, isOffline: false });
      setLoading(false);

    } catch (err) {
      console.warn("Mất mạng hoặc API lỗi! Kích hoạt Tesseract Offline...");
      
      Tesseract.recognize(image, 'vie', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(parseInt(m.progress * 100));
          }
        }
      }).then(({ data: { text } }) => {
        setNutrition(parseLocalData(text));
        setLoading(false);
      }).catch(tessErr => {
        alert("Lỗi quét Offline: " + tessErr.message);
        setLoading(false);
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 flex flex-col items-center font-sans pb-10">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-6 border border-white">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-black italic text-slate-900 leading-none">NUTRITION <span className="text-green-500">AI</span></h1>
          <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase mt-1">Personal Dietitian v4.0</p>
        </header>

        {/* Bảng nhập thông số thể trạng */}
        <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Thông số thể trạng</h3>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" name="age" value={userProfile.age} onChange={handleInputChange} placeholder="Tuổi" className="p-2 text-sm font-bold border rounded-xl text-center outline-none focus:border-green-400" />
            <select name="gender" value={userProfile.gender} onChange={handleInputChange} className="p-2 text-sm font-bold border rounded-xl text-center outline-none focus:border-green-400 bg-white">
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
            <div className="relative">
              <input type="number" name="weight" value={userProfile.weight} onChange={handleInputChange} placeholder="Nặng" className="w-full p-2 text-sm font-bold border rounded-xl text-center outline-none focus:border-green-400" />
              <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">kg</span>
            </div>
            <div className="relative">
              <input type="number" name="height" value={userProfile.height} onChange={handleInputChange} placeholder="Cao" className="w-full p-2 text-sm font-bold border rounded-xl text-center outline-none focus:border-green-400" />
              <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">cm</span>
            </div>
          </div>
        </div>

        {/* Khu vực ảnh */}
        <div className="mb-6 relative aspect-video bg-slate-50 rounded-[2rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden group">
          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 z-10 cursor-pointer" onChange={(e) => {
            setImage(URL.createObjectURL(e.target.files[0]));
            setImageFile(e.target.files[0]); 
          }} />
          {image ? <img src={image} className="w-full h-full object-cover" alt="preview" /> : 
            <div className="text-center">
              <span className="text-4xl mb-2 block">📸</span>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chụp nhãn dán đồ ăn / nước uống</p>
            </div>
          }
        </div>

        {/* Nút bấm & Thanh tiến trình */}
        <div className="space-y-3">
          <button onClick={handleScan} disabled={loading} className={`w-full py-5 rounded-2xl font-black text-white uppercase tracking-widest shadow-lg transition-transform active:scale-95 ${loading ? 'bg-slate-400' : 'bg-green-600 hover:bg-green-700'}`}>
            {loading ? "BÁC SĨ AI ĐANG PHÂN TÍCH..." : "QUÉT & NHẬN TƯ VẤN"}
          </button>
          
          {loading && progress > 0 && (
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              <p className="text-[8px] text-center font-bold text-slate-400 mt-1">TIẾN ĐỘ TESSERACT: {progress}%</p>
            </div>
          )}
        </div>

        {/* Kết quả Dashboard */}
        {nutrition && (
          <div className="mt-8 space-y-4 animate-in fade-in zoom-in duration-500">
            <div className={`text-center py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${nutrition.isOffline ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
              {nutrition.isOffline ? '● CHẾ ĐỘ NỘI BỘ (OFFLINE)' : '● TRỢ LÝ DINH DƯỠNG CÁ NHÂN HÓA'}
            </div>

            <div className="bg-slate-900 p-5 rounded-[2rem] text-white flex justify-between items-center">
              <div className="max-w-[75%]">
                <p className="text-[9px] opacity-40 font-bold uppercase mb-1 tracking-tighter">Sản phẩm nhận diện</p>
                <h2 className="text-lg font-black leading-tight uppercase truncate">{nutrition.product_name}</h2>
              </div>
              <div className="text-center border-l border-white/10 pl-4">
                <div className="text-2xl font-black text-green-400 leading-none">{nutrition.health_score}</div>
                <div className="text-[8px] opacity-40 font-bold uppercase">Score</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {Object.entries(nutrition.stats).map(([key, val], i) => (
                <div key={i} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                  <p className="text-[7px] font-black text-slate-400 uppercase mb-1">{key}</p>
                  <p className="text-[10px] font-black text-slate-800 truncate w-full text-center leading-none">{val}</p>
                </div>
              ))}
            </div>

            {/* Khối Tư Vấn Cá Nhân */}
            <div className="bg-white p-5 rounded-[2rem] border border-blue-100 shadow-sm bg-blue-50/40">
              <h3 className="text-[9px] font-black text-blue-600 uppercase mb-3 border-b border-blue-100 pb-1 flex items-center">
                <span className="mr-1">🧑‍⚕️</span> Đánh giá theo thể trạng:
              </h3>
              <ul className="space-y-2">
                {nutrition.short_advice.map((adv, i) => (
                  <li key={i} className="text-[11px] font-medium text-slate-700 leading-tight">
                    • {adv}
                  </li>
                ))}
              </ul>
            </div>

            {/* Khối Thực Phẩm Thay Thế */}
            <div className="bg-white p-5 rounded-[2rem] border border-orange-100 shadow-sm bg-orange-50/40">
              <h3 className="text-[9px] font-black text-orange-600 uppercase mb-3 border-b border-orange-100 pb-1 flex items-center">
                <span className="mr-1">💡</span> Gợi ý món thay thế:
              </h3>
              <ul className="space-y-2">
                {nutrition.alternatives?.map((alt, i) => (
                  <li key={i} className="text-[11px] font-medium text-slate-700 leading-tight flex items-start">
                    <span className="text-orange-500 mr-2">»</span> {alt}
                  </li>
                ))}
              </ul>
            </div>
            
          </div>
        )}
      </div>
      <footer className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        Trần Thiên Tuệ - D22_TH10 - STU
      </footer>
    </div>
  );
}

export default App;