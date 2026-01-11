# 🔥 PROTOCOL PHOENIX - DISASTER RECOVERY GUIDE

**Mục đích:** Khôi phục toàn bộ hệ thống Quantix Core từ file backup về trạng thái hoạt động 100%.

---

## 🛑 TRƯỜNG HỢP ÁP DỤNG
- Máy chủ bị hỏng/mất dữ liệu.
- Chuyển sang máy tính mới.
- Database bị xóa nhầm.

---

## 🛠️ QUY TRÌNH PHỤC HỒI (3 BƯỚC)

### BƯỚC 1: KHÔI PHỤC MÃ NGUỒN (CODEBASE)

1. **Chuẩn bị file Backup:**
   - Tìm file `Quantix_V1.5_Core_Source_2026_01_11.zip` (đã lưu trên USB/Cloud).
   - Giải nén ra thư mục làm việc mới (Ví dụ: `D:\Quantix_Core`).

2. **Cài đặt môi trường:**
   Mở terminal tại thư mục vừa giải nén:
   ```bash
   npm install
   ```
   *(Lệnh này sẽ tự động tải lại hàng nghìn thư viện node_modules từ internet)*

### BƯỚC 2: KẾT NỐI HẠ TẦNG (INFRASTRUCTURE)

1. **Kiểm tra file cấu hình:**
   - Mở file `.env`.
   - Đảm bảo `DB_HOST`, `DB_USER`, `DB_PASSWORD` là chính xác (Nếu bạn dùng Database mới, hãy cập nhật thông tin mới vào đây).

2. **Kiểm tra kết nối:**
   ```bash
   npm run db:check
   ```
   - Nếu thấy `✅ SUCCESS: Connection established!`, chuyển sang bước 3.
   - Nếu Database mới tinh chưa có bảng (Table), hãy chạy lệnh tạo bảng:
     - Mở Supabase SQL Editor -> Copy nội dung từ `database/schema.sql` -> Run.

### BƯỚC 3: HỒI SINH DỮ LIỆU (DATA RESURRECTION)

Dữ liệu lịch sử (6,000+ nến) và tín hiệu AI nằm trong thư mục `Data_Snapshot`. Để nạp lại chúng vào Database:

1. **Chạy "Protocol Phoenix":**
   ```bash
   node scripts/restore_data.js
   ```

2. **Xác nhận kết quả:**
   ```
   ♻️ Restoring table: assets_master...
   ✅ Restored 5 records
   ♻️ Restoring table: market_data...
   ✅ Restored 6176 records
   ♻️ Restoring table: ai_signals...
   ✅ Restored 6 records
   
   ✨ SYSTEM RESTORATION COMPLETE!
   ```

---

## 🎯 KIỂM TRA SAU PHỤC HỒI

Sau khi chạy xong, hãy kiểm tra lần cuối:

1. **Chạy Validation:**
   ```bash
   npm run data:validate
   ```
   *(Phải đạt điểm 100/100 như trước khi backup)*

2. **Start Server:**
   ```bash
   npm start
   ```

**Hệ thống Quantix Core đã "Tái sinh" thành công! 🦅🔥**
