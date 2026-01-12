# 📘 Quantix AI System Handover (v1.9.1 - Autopilot)

## 🌍 1. Hệ Thống Đang Nằm Ở Đâu? (Locations)

Hệ thống hiện tại là **Cloud-Native Distribution** (Phân tán trên Cloud), không phụ thuộc vào máy cá nhân của bạn.

| Thành Phần | Vị Trí (URL / Host) | Trạng Thái | Vai Trò |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | [GitHub Pages Dashboard](https://9dpi.github.io/ai-forecast-demo/#/mvp) | 🟢 Live | Giao diện cho người dùng (Irfan, Investors). Kết nối trực tiếp với Backend trên Railway. |
| **Backend Core** | `web-production-fbb05.up.railway.app` (Railway) | 🟢 Online | Bộ não xử lý, Chatbot API, và trung tâm điều phối. |
| **Database** | Supabase (Cloud PostgreSQL) | 🟢 Online | Lưu trữ 1 năm dữ liệu lịch sử và signals thời gian thực. |
| **Source Code** | [GitHub Repo (9dpi/quantix)](https://github.com/9dpi/quantix) | 🔒 Secure | Tag: `v1.9.1-stable` |

---

## 🤖 2. Cơ Chế Tự Động Hóa 24/7 (Automation Breakdown)

Trên Railway, hệ thống đang chạy **3 Processes song song**, được quản lý bởi `Procfile` và Docker:

### 🅰️ Khối 1: `web` (API Server)
*   **Nhiệm vụ:** Lắng nghe các yêu cầu từ Dashboard và Chatbot.
*   **Hoạt động:** Luôn bật (Always On).
*   **Logic:** Khi người dùng chat trên web, `web` sẽ nhận tin -> xử lý qua Gemini AI / Database -> trả lời ngay lập tức.

### 🅱️ Khối 2: `worker` (Price Watchdog) -> "Người bảo vệ"
*   **Nhiệm vụ:** Canh gác thị trường không ngủ.
*   **Tần suất:** Mỗi 10-60 giây (tùy cấu hình).
*   **Quy trình tự động:**
    1.  Gọi API Alpha Vantage lấy giá EUR/USD hiện tại.
    2.  So sánh giá với các Signal đang mở (Entry / TP / SL).
    3.  Nếu chạm điểm TP/SL -> **Tự động chốt lệnh** trong Database.
    4.  Cập nhật giá mới nhất vào Database -> Dashboard sẽ tự nhảy số (Real-time).

### 🅾️ Khối 3: `scheduler` (Timekeeper) -> "Thư ký"
*   **Nhiệm vụ:** Gửi báo cáo định kỳ lên Telegram.
*   **Lịch trình (theo giờ Việt Nam - GMT+7):**
    *   📅 **08:30 sáng:** Gửi "Market Pulse" (Nhận định đầu ngày).
    *   🛡️ **Mỗi 3 tiếng:** Gửi "Guardian Report" (nếu thị trường yên ắng).
    *   🌙 **23:00 tối:** Gửi "Daily Recap" (Tổng kết thắng/thua trong ngày).

---

## 🛡️ 3. Cơ Chế An Toàn & Phục Hồi (Self-Healing)

*   **Tự động khởi động lại (Auto-Restart):** Nếu một khối (ví dụ `web`) bị lỗi và sập, Railway sẽ tự động dựng nó dậy ngay lập tức. Bạn không cần làm gì cả.
*   **Docker Container:** Toàn bộ môi trường (Node.js, thư viện `cors`, `pg`...) được gói gọn trong Docker Container. Đảm bảo chạy trên Cloud giống hệt như lúc chạy thử nghiệm (No "it works on my machine" syndrome).
*   **Health Check:** Railway liên tục "ping" vào đường dẫn `/health`. Nếu server không trả lời, nó sẽ coi là bị treo và reset lại.

---

## 🚀 4. Hướng Dẫn Sử Dụng Nhanh

**Q: Tôi muốn xem giá hiện tại?**
A: Vào Link Dashboard. Giá tự nhảy.

**Q: Tôi muốn chat với AI?**
A: Bấm vào biểu tượng Chat trên Dashboard.

**Q: Tôi muốn kiểm tra xem hệ thống còn sống không?**
A:
1. Vào Dashboard xem giá có nhảy không.
2. Hoặc vào Railway App xem 3 đèn có xanh không.
3. Hoặc truy cập: `https://web-production-fbb05.up.railway.app/health`

**Q: Tôi muốn cập nhật code mới?**
A: Chỉ cần code trên máy local -> `git push origin main`. Railway sẽ tự động phát hiện, build lại Docker, và update server (Zero Downtime Deployment).

---

**✨ HỆ THỐNG ĐÃ SẴN SÀNG ĐỂ CHINH PHỤC THỊ TRƯỜNG! ✨**
