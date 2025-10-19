# 🚀 Hướng Dẫn Cài Đặt Extension AI Answer Assistant

## 📋 Yêu Cầu Hệ Thống

### ✅ Phần mềm cần thiết
- **Google Chrome** phiên bản 88 trở lên
- **Windows 10/11**, **macOS 10.14+**, hoặc **Linux**
- Kết nối internet ổn định

### ✅ Tài khoản cần thiết
- **Tài khoản Google** (để tạo API key)
- **Google Cloud Console** access (miễn phí)

## 🔧 Cài Đặt Extension

### Bước 1: Tải Extension
1. Tải toàn bộ thư mục `Extension-Answer-AI` về máy
2. Giải nén nếu cần (thư mục phải chứa các file: `manifest.json`, `background.js`, `content.js`, v.v.)

### Bước 2: Mở Chrome Extensions
1. Mở Google Chrome
2. Gõ `chrome://extensions/` vào thanh địa chỉ
3. Nhấn Enter

### Bước 3: Bật Developer Mode
1. Tìm nút **"Developer mode"** ở góc trên bên phải
2. Bật toggle này (chuyển sang màu xanh)

### Bước 4: Load Extension
1. Nhấn nút **"Load unpacked"** (xuất hiện sau khi bật Developer mode)
2. Chọn thư mục `Extension-Answer-AI`
3. Nhấn **"Select Folder"**

### Bước 5: Xác nhận cài đặt
1. Extension sẽ xuất hiện trong danh sách với tên **"AI Answer Assistant"**
2. Icon 🤖 sẽ xuất hiện trên thanh công cụ Chrome
3. Đảm bảo extension được **bật** (toggle màu xanh)

## 🔑 Tạo Google API Key

### Bước 1: Truy cập Google Cloud Console
1. Mở trình duyệt và vào [Google Cloud Console](https://console.cloud.google.com/)
2. Đăng nhập bằng tài khoản Google của bạn

### Bước 2: Tạo Project (nếu chưa có)
1. Nhấn vào dropdown project ở đầu trang
2. Nhấn **"New Project"**
3. Đặt tên project: `AI Answer Assistant`
4. Nhấn **"Create"**

### Bước 3: Bật Generative Language API
1. Vào **"APIs & Services"** > **"Library"**
2. Tìm kiếm **"Generative Language API"**
3. Nhấn vào kết quả đầu tiên
4. Nhấn **"Enable"**

### Bước 4: Tạo API Key
1. Vào **"APIs & Services"** > **"Credentials"**
2. Nhấn **"+ CREATE CREDENTIALS"**
3. Chọn **"API key"**
4. Copy API key (dạng: `AIzaSy...`)
5. **Lưu ý**: Giữ bí mật API key này!

### Bước 5: Cấu hình API Key trong Extension
1. Nhấn vào icon extension 🤖 trên thanh công cụ
2. Dán API key vào ô **"Google API Key"**
3. Nhấn **"Save"**
4. Nhấn **"Test"** để kiểm tra kết nối
5. Nếu thành công, sẽ hiện thông báo màu xanh

## ✅ Kiểm Tra Cài Đặt

### Test 1: Kiểm tra phím tắt
1. Mở bất kỳ trang web nào
2. Nhấn **`Ctrl + Shift + Q`**
3. Nếu xuất hiện hướng dẫn "Drag to select an area", cài đặt thành công

### Test 2: Test chức năng đầy đủ
1. Mở trang web có câu hỏi (ví dụ: Google)
2. Nhấn **`Ctrl + Shift + Q`**
3. Kéo thả để chọn vùng chứa text
4. Chờ extension xử lý
5. Kiểm tra popup kết quả

### Test 3: Kiểm tra API
1. Nhấn vào icon extension
2. Nhấn **"Check APIs"**
3. Kiểm tra tất cả đều hiện ✅

## 🛠️ Xử Lý Lỗi Thường Gặp

### ❌ "Extension could not be loaded"
**Nguyên nhân**: File manifest.json bị lỗi hoặc thiếu file
**Giải pháp**:
1. Kiểm tra thư mục có đầy đủ file
2. Đảm bảo `manifest.json` hợp lệ
3. Thử load lại extension

### ❌ "This extension may not be safe"
**Nguyên nhân**: Chrome cảnh báo extension chưa được verify
**Giải pháp**:
1. Nhấn **"Load anyway"** hoặc **"Load unpacked"**
2. Đây là bình thường với extension tự tạo

### ❌ "API key not found"
**Nguyên nhân**: Chưa nhập API key
**Giải pháp**:
1. Vào popup extension
2. Nhập API key đã tạo
3. Nhấn Save

### ❌ "API connection failed"
**Nguyên nhân**: API key sai hoặc chưa bật API
**Giải pháp**:
1. Kiểm tra API key đúng format `AIzaSy...`
2. Đảm bảo đã bật Generative Language API
3. Thử tạo API key mới

### ❌ "OCR services unavailable"
**Nguyên nhân**: Dịch vụ OCR tạm thời không khả dụng
**Giải pháp**:
1. Thử lại sau vài phút
2. Extension sẽ hiện popup nhập tay
3. Nhập text thủ công

## 🔄 Cập Nhật Extension

### Khi có phiên bản mới:
1. Tải phiên bản mới về
2. Thay thế thư mục cũ
3. Vào `chrome://extensions/`
4. Nhấn nút **"Reload"** (🔄) trên extension
5. Test lại chức năng

## 🗑️ Gỡ Cài Đặt

### Nếu muốn xóa extension:
1. Vào `chrome://extensions/`
2. Tìm extension **"AI Answer Assistant"**
3. Nhấn **"Remove"**
4. Xác nhận xóa

## 📞 Hỗ Trợ

### Nếu gặp vấn đề:
1. **Kiểm tra Console**: Nhấn F12 > Console để xem lỗi chi tiết
2. **Reload Extension**: Vào `chrome://extensions/` > Reload
3. **Kiểm tra API**: Dùng nút "Check APIs" trong popup
4. **Test từng bước**: Test phím tắt trước, sau đó test đầy đủ

### Thông tin debug:
- Chrome version: `chrome://version/`
- Extension version: Trong `chrome://extensions/`
- Console errors: F12 > Console

---

**🎉 Chúc mừng! Extension đã sẵn sàng sử dụng!**
