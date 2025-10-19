# 🤖 AI Answer Assistant - Extension Trình Duyệt

Một extension Chrome/Firefox giúp chụp màn hình câu hỏi, chuyển đổi thành text bằng OCR, và sử dụng AI để đưa ra đáp án chính xác.

## ✨ Tính Năng

- 📸 **Chụp màn hình thông minh**: Kéo thả để chọn vùng câu hỏi
- 🔤 **OCR tích hợp**: Chuyển đổi ảnh thành text tự động
- 🤖 **AI phân tích**: Sử dụng OpenAI GPT để phân tích và trả lời câu hỏi
- 🎯 **Hỗ trợ nhiều loại câu hỏi**: Trắc nghiệm, tự luận, toán học
- 🌐 **Giao diện tiếng Việt**: Dễ sử dụng và thân thiện

## 🚀 Cài Đặt

### Bước 1: Tải Extension
1. Tải toàn bộ thư mục extension về máy
2. Mở Chrome/Edge và vào `chrome://extensions/`
3. Bật "Developer mode" ở góc trên bên phải
4. Nhấn "Load unpacked" và chọn thư mục extension

### Bước 2: Cấu Hình API
1. Nhấn vào icon extension trên thanh công cụ
2. Nhập OpenAI API key của bạn
3. Nhấn "Lưu cài đặt"

## 📖 Hướng Dẫn Sử Dụng

### Cách Sử Dụng Cơ Bản
1. **Mở extension**: Nhấn vào icon AI Answer Assistant trên thanh công cụ
2. **Nhập API key**: Đảm bảo đã nhập OpenAI API key
3. **Bắt đầu chụp**: Nhấn "Bắt đầu chụp màn hình"
4. **Chọn vùng**: Kéo thả để chọn vùng chứa câu hỏi
5. **Xem kết quả**: AI sẽ phân tích và đưa ra đáp án

### Các Loại Câu Hỏi Được Hỗ Trợ
- ✅ **Câu hỏi trắc nghiệm**: Phân tích các đáp án và chọn đáp án đúng
- ✅ **Câu hỏi toán học**: Giải bài toán với các bước chi tiết
- ✅ **Câu hỏi tự luận**: Trả lời câu hỏi mở với cấu trúc rõ ràng
- ✅ **Câu hỏi tiếng Anh**: Hỗ trợ cả tiếng Anh và tiếng Việt

## ⚙️ Cấu Hình

### API Keys Cần Thiết
- **OpenAI API Key**: Để sử dụng AI phân tích câu hỏi
- **OCR.space API Key**: Để chuyển đổi ảnh thành text (có sẵn key demo)

### Cài Đặt Nâng Cao
Bạn có thể chỉnh sửa file `background.js` để:
- Thay đổi model AI (GPT-3.5, GPT-4)
- Điều chỉnh độ chính xác OCR
- Thêm ngôn ngữ OCR mới

## 🔧 Cấu Trúc Dự Án

```
Extension-Answer-AI/
├── manifest.json          # Cấu hình extension
├── popup.html             # Giao diện chính
├── popup.js               # Logic giao diện
├── content.js             # Script chụp màn hình
├── background.js          # Xử lý OCR và AI
├── utils/
│   └── ai.js             # Utilities AI
├── icon.png              # Icon extension
└── README.md             # Hướng dẫn này
```

## 🛠️ Phát Triển

### Yêu Cầu Hệ Thống
- Chrome/Edge 88+ hoặc Firefox 78+
- Node.js (để phát triển)
- OpenAI API key

### Cài Đặt Dependencies
```bash
# Không cần cài đặt dependencies cho extension cơ bản
# Chỉ cần có API keys
```

### Chạy Extension
1. Mở Chrome/Edge
2. Vào `chrome://extensions/`
3. Bật Developer mode
4. Load unpacked extension
5. Chọn thư mục dự án

## 🐛 Xử Lý Lỗi

### Lỗi Thường Gặp
- **"Không thể đọc text từ ảnh"**: Thử chụp lại với ảnh rõ nét hơn
- **"OpenAI API Error"**: Kiểm tra API key và tài khoản
- **"Không thể khởi tạo chụp màn hình"**: Refresh trang và thử lại

### Debug
1. Mở Developer Tools (F12)
2. Vào tab Console
3. Xem lỗi chi tiết
4. Kiểm tra Network tab để xem API calls

## 📝 Ghi Chú

- Extension sử dụng OCR.space API miễn phí (có giới hạn)
- OpenAI API có phí, vui lòng kiểm tra pricing
- Dữ liệu được xử lý locally, không lưu trữ trên server

## 🤝 Đóng Góp

Mọi đóng góp đều được chào đón! Hãy:
1. Fork dự án
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 📞 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra README này
2. Xem Issues trên GitHub
3. Tạo Issue mới nếu cần

---

**Chúc bạn sử dụng extension hiệu quả! 🎉**
