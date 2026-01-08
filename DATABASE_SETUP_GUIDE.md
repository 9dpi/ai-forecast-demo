# Database Setup Guide (Supabase PostgreSQL)

Chúng ta sẽ sử dụng **Supabase** (Dịch vụ Database nền tảng PostgreSQL số 1 hiện nay) vì nó có gói **Free Tier** rất hào phóng (500MB data) và tích hợp sẵn API, cực kỳ phù hợp cho giai đoạn khởi nghiệp này.

## Bước 1: Tạo tài khoản & Project mới
1.  Truy cập [Supabase.com](https://supabase.com/) và đăng ký tài khoản (Sign up with GitHub).
2.  Bấm **"New Project"**.
3.  Điền thông tin:
    *   **Name:** `AI-Forecast-Commercial`
    *   **Database Password:** (Tự đặt mật khẩu mạnh và LƯU LẠI - chúng ta sẽ dùng nó để kết nối từ Python).
    *   **Region:** Chọn `Singapore` (để có tốc độ tốt nhất về Việt Nam).
4.  Bấm **"Create new project"** và đợi khoảng 1-2 phút để hệ thống khởi tạo.

## Bước 2: Chạy Script khởi tạo (Schema)
Sau khi Project đã sẵn sàng:
1.  Vào mục **SQL Editor** (icon thứ 3 bên trái thanh menu).
2.  Bấm **"New Query"**.
3.  Copy toàn bộ nội dung từ file `database/schema.sql` trong dự án của chúng ta (File này mình vừa tạo trên máy bạn).
4.  Paste vào khung soạn thảo trên Supabase.
5.  Bấm nút **"Run"** (Góc dưới bên phải).
    *   *Kết quả:* Bạn sẽ thấy thông báo "Success" và các bảng `assets_master`, `market_data`, v.v. được tạo ra.

## Bước 3: Lấy chuỗi kết nối (Connection String)
Để code Python có thể ghi dữ liệu vào đây:
1.  Vào mục **Project Settings** (icon bánh răng cưa).
2.  Chọn **Database**.
3.  Kéo xuống phần **Connection Parameters**.
4.  Copy 2 thông tin quan trọng:
    *   **Host:** `aws-0-ap-southeast-1.pooler.supabase.com` (ví dụ vậy).
    *   **User:** `postgres`
    *   **Password:** (Cái bạn đặt ở Bước 1).
    *   **Port:** `5432` hoặc `6543`.
    *   **Database Name:** `postgres`

> **Lưu ý:** Hãy lưu các thông tin này vào một file text trên máy (đừng share cho ai). Buổi sau chúng ta sẽ dùng nó để cấu hình file `.env` cho Tool quét dữ liệu.
