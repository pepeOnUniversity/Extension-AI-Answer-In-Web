# 🤖 AI Answer Assistant - Hướng Dẫn Sử Dụng

## 📖 Tổng Quan
Extension AI Answer Assistant giúp bạn chụp vùng màn hình chứa câu hỏi, tự động chuyển thành text bằng OCR, và nhận câu trả lời từ AI một cách nhanh chóng.

## 🚀 Cài Đặt Extension

### Bước 1: Chuẩn bị
1. Tải Google Chrome (phiên bản mới nhất)
2. Tải thư mục extension này về máy

### Bước 2: Cài đặt
1. Mở Chrome và gõ `chrome://extensions/` vào thanh địa chỉ
2. Bật **"Developer mode"** ở góc trên bên phải
3. Nhấn **"Load unpacked"**
4. Chọn thư mục chứa extension
5. Extension sẽ xuất hiện trong danh sách với icon 🤖

### Bước 3: Cấu hình API
1. Nhấn vào icon extension trên thanh công cụ
2. Nhập **Google API Key** (xem hướng dẫn tạo API key bên dưới)
3. Nhấn **"Save"** và **"Test"** để kiểm tra

## 🔑 Tạo Google API Key

### Bước 1: Truy cập Google Cloud Console
1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Đăng nhập bằng tài khoản Google
3. Tạo project mới hoặc chọn project có sẵn

### Bước 2: Bật API
1. Vào **"APIs & Services"** > **"Library"**
2. Tìm và chọn **"Generative Language API"**
3. Nhấn **"Enable"**

### Bước 3: Tạo API Key
1. Vào **"APIs & Services"** > **"Credentials"**
2. Nhấn **"+ CREATE CREDENTIALS"** > **"API key"**
3. Copy API key (dạng: `AIzaSy...`)
4. Dán vào extension

## 🎯 Cách Sử Dụng

### Phương pháp 1: Phím tắt (Khuyến nghị)
1. **Nhấn `Ctrl + Shift + Q`** trên bất kỳ trang web nào
2. **Kéo thả** để chọn vùng chứa câu hỏi
3. Chờ extension xử lý (2-5 giây)
4. Xem kết quả trong popup

### Phương pháp 2: Qua popup
1. Nhấn vào icon extension
2. Nhấn nút **"Activate Selection"** (nếu có)

## ✨ Tính Năng Chính

### 🔍 OCR Thông Minh
- **Miễn phí 100%**: Sử dụng OCR.space API
- **Hỗ trợ đa ngôn ngữ**: Tiếng Anh, Tiếng Việt
- **Tự động sửa lỗi**: Sửa các lỗi OCR phổ biến
- **Fallback**: Nhập tay nếu OCR thất bại

### 🤖 AI Trả Lời
- **Google Gemini**: Sử dụng AI mạnh mẽ của Google
- **Tự động phân loại**: Nhận diện loại câu hỏi
- **Trả lời chi tiết**: Giải thích từng bước
- **Hỗ trợ đa ngôn ngữ**: Tiếng Anh và Tiếng Việt

### 🎨 Giao Diện Đẹp
- **Popup hiện đại**: Thiết kế đẹp mắt
- **Animation mượt**: Hiệu ứng chuyển động
- **Responsive**: Tự động điều chỉnh kích thước
- **Tự động đóng**: Sau 30 giây

## 📚 Các Loại Câu Hỏi Được Hỗ Trợ

### ✅ Câu hỏi trắc nghiệm
- Tự động nhận diện đáp án A, B, C, D
- Giải thích tại sao đáp án đúng
- Phân tích các đáp án sai

### ✅ Bài tập toán
- Giải từng bước chi tiết
- Hiển thị công thức và phép tính
- Kiểm tra kết quả

### ✅ Câu hỏi lý thuyết
- Trả lời đầy đủ và chính xác
- Giải thích khái niệm
- Đưa ra ví dụ minh họa

### ✅ Code và lập trình
- Phân tích code
- Tìm lỗi và sửa lỗi
- Đề xuất cải tiến

## 🛠️ Xử Lý Sự Cố

### Lỗi "API key not found"
- **Nguyên nhân**: Chưa nhập API key
- **Giải pháp**: Vào popup extension và nhập API key

### Lỗi "API connection failed"
- **Nguyên nhân**: API key sai hoặc chưa bật API
- **Giải pháp**: Kiểm tra API key và bật Generative Language API

### OCR không hoạt động
- **Nguyên nhân**: Dịch vụ OCR tạm thời không khả dụng
- **Giải pháp**: Extension sẽ hiện popup nhập tay

### Extension không phản hồi
- **Nguyên nhân**: Context bị mất
- **Giải pháp**: Reload extension và refresh trang

## 💡 Mẹo Sử Dụng Hiệu Quả

### 🎯 Chọn vùng tốt nhất
- Chọn vùng chứa đầy đủ câu hỏi
- Tránh chọn vùng quá nhỏ hoặc quá lớn
- Đảm bảo text rõ ràng, không bị mờ

### ⚡ Tối ưu tốc độ
- Sử dụng phím tắt `Ctrl + Shift + Q`
- Chọn vùng vừa phải (không quá lớn)
- Đảm bảo kết nối internet ổn định

### 🔧 Cấu hình nâng cao
- Thay đổi API key khi cần
- Kiểm tra trạng thái API bằng nút "Check APIs"
- Xóa API key bằng nút "Clear"

## 📞 Hỗ Trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra console (F12) để xem lỗi chi tiết
2. Thử reload extension
3. Kiểm tra kết nối internet
4. Xác nhận API key đúng

## 🔄 Cập Nhật

Extension sẽ tự động cập nhật khi có phiên bản mới. Bạn chỉ cần:
1. Tải phiên bản mới
2. Thay thế thư mục cũ
3. Reload extension trong Chrome

---

**Chúc bạn sử dụng extension hiệu quả! 🎉**
