# 🤖 AI Answer Assistant - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan
AI Answer Assistant là một extension Chrome **100% MIỄN PHÍ** giúp bạn:
- **Chọn bất kỳ vùng nào** trên màn hình
- **Tự động trích xuất văn bản** bằng OCR miễn phí
- **Nhận câu trả lời AI** từ nhiều provider miễn phí

## 🚀 Cài Đặt

### Bước 1: Tải Extension
1. Tải file `.zip` từ GitHub repository
2. Giải nén file vào thư mục bất kỳ

### Bước 2: Cài Đặt Trên Chrome
1. Mở Chrome và vào `chrome://extensions/`
2. Bật **Developer mode** (góc trên bên phải)
3. Nhấn **Load unpacked**
4. Chọn thư mục đã giải nén
5. Extension sẽ xuất hiện trong danh sách

### Bước 3: Chọn AI Provider
1. Nhấn vào icon extension trên thanh công cụ
2. Chọn AI Provider từ dropdown:
   - **🆓 Hugging Face** (100% miễn phí, không cần API key)
   - **⚡ Groq** (có free tier, cần API key)
   - **🏠 Ollama** (chạy local, 100% miễn phí)
   - **🔍 Google Gemini** (trả phí, cần API key)

## 🆓 Các AI Provider Miễn Phí

### 1. Hugging Face (Khuyến Nghị)
- **100% miễn phí** không cần API key
- Sử dụng ngay lập tức
- Tốc độ nhanh, chất lượng tốt
- **Cách dùng**: Chọn "Hugging Face" và nhấn Save

### 2. Groq (Free Tier)
- **Miễn phí** với giới hạn hợp lý
- Tốc độ cực nhanh
- **Cách lấy API key**:
  1. Truy cập [console.groq.com](https://console.groq.com/)
  2. Đăng ký tài khoản miễn phí
  3. Tạo API key
  4. Copy key (dạng `gsk_...`)

### 3. Ollama (Local - 100% Miễn Phí)
- Chạy AI trên máy tính của bạn
- **Không cần internet** sau khi cài đặt
- **Cách cài đặt**:
  1. Tải [Ollama](https://ollama.ai/) về máy
  2. Cài đặt và chạy Ollama
  3. Cài model: `ollama pull llama3`
  4. Chọn "Ollama" trong extension

### 4. Google Gemini (Trả Phí)
- Chất lượng cao nhất
- **Cách lấy API key**:
  1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
  2. Tạo project và kích hoạt Generative Language API
  3. Tạo API key
  4. Copy key (dạng `AIzaSy...`)

## 💰 Chi Phí Sử Dụng
- **OCR**: 100% miễn phí
- **AI Answers**:
  - **Hugging Face**: 100% miễn phí
  - **Groq**: Free tier (14,400 requests/ngày)
  - **Ollama**: 100% miễn phí (chạy local)
  - **Google Gemini**: Trả phí ($0.0005/1K characters)

## 🎯 Cách Sử Dụng

### Phương Pháp 1: Phím Tắt
1. Nhấn **Ctrl + Shift + Q** (Windows/Linux) hoặc **Cmd + Shift + Q** (Mac)
2. Con trỏ chuột sẽ chuyển thành dấu thập
3. Kéo thả để chọn vùng cần phân tích
4. Chờ kết quả AI (thường 2-5 giây)

### Phương Pháp 2: Click Icon
1. Nhấn vào icon extension trên thanh công cụ
2. Nhấn **Activate Selection** trong popup
3. Chọn vùng cần phân tích
4. Xem kết quả

## ✨ Tính Năng

### 🆓 OCR Miễn Phí
- Sử dụng nhiều dịch vụ OCR công cộng
- Tự động fallback nếu một dịch vụ lỗi
- Hỗ trợ nhiều ngôn ngữ

### 🤖 AI Thông Minh
- **4 provider AI** khác nhau
- Hiểu ngữ cảnh và câu hỏi
- Trả lời chi tiết, có giải thích
- Hỗ trợ toán học, khoa học, lập trình

### 📋 Sao Chép Dễ Dàng
- Nút **Copy** cho văn bản trích xuất
- Nút **Copy** cho câu trả lời AI
- Lưu vào clipboard một cách nhanh chóng

### ⚡ Hiển Thị Thời Gian
- Hiển thị thời gian xử lý (⚡ X.Xs)
- Theo dõi hiệu suất

## 🔧 Xử Lý Sự Cố

### Lỗi "API key not found"
- **Hugging Face**: Không cần API key, chọn provider khác
- **Groq/Gemini**: Kiểm tra đã nhập API key chưa
- **Ollama**: Đảm bảo Ollama đang chạy

### Lỗi "Extension context invalidated"
- Reload extension trong `chrome://extensions/`
- Refresh trang web hiện tại
- Khởi động lại Chrome

### OCR không hoạt động
- Thử chọn vùng khác có văn bản rõ ràng hơn
- Kiểm tra kết nối internet
- Extension sẽ tự động thử các dịch vụ OCR khác

### AI không trả lời
- **Hugging Face**: Thử lại sau vài giây (model có thể đang load)
- **Groq**: Kiểm tra API key và quota
- **Ollama**: Đảm bảo Ollama đang chạy và có model
- **Gemini**: Kiểm tra API key và billing

## 🎨 Tùy Chỉnh

### Thay Đổi AI Provider
1. Nhấn icon extension
2. Chọn provider từ dropdown
3. Nhập API key nếu cần
4. Nhấn **Save**

### Thay Đổi Phím Tắt
1. Vào `chrome://extensions/shortcuts`
2. Tìm "AI Answer Assistant"
3. Thay đổi phím tắt theo ý muốn

## 📞 Hỗ Trợ

### Báo Lỗi
- Tạo issue trên GitHub repository
- Mô tả chi tiết lỗi và cách tái tạo
- Đính kèm screenshot nếu có

### Đóng Góp
- Fork repository
- Tạo pull request với cải tiến
- Tham gia thảo luận trong issues

## 🔒 Bảo Mật

### API Key
- **Không bao giờ** chia sẻ API key
- Sử dụng API restrictions khi có thể
- Thường xuyên kiểm tra usage

### Dữ Liệu
- Văn bản chỉ được gửi đến provider đã chọn
- Không lưu trữ dữ liệu cá nhân
- Mã nguồn mở, minh bạch

## 🚀 Cập Nhật

### Tự Động
- Chrome sẽ tự động cập nhật extension
- Kiểm tra phiên bản mới trong `chrome://extensions/`

### Thủ Công
- Tải phiên bản mới từ GitHub
- Thay thế file cũ
- Reload extension

---

**🎉 Chúc bạn sử dụng AI Answer Assistant hiệu quả với các AI provider miễn phí!**

*Nếu có thắc mắc, hãy tạo issue trên GitHub hoặc liên hệ qua email.*