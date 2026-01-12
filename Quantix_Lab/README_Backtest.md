# 🧪 QUANTIX AI LABORATORY - BACKTEST WORKFLOW

Chào mừng bạn đến với Phòng Thí Nghiệm Quantix. Đây là nơi bạn kiểm chứng sức mạnh của các thuật toán AI trước khi triển khai thực tế.

## 📂 Cấu trúc thư mục
- `/data`: Chứa file `history_2025.csv` trích xuất từ Supabase.
- `/core`: Bao gồm các file logic cốt lõi từ hệ thống (Technical Agent, Critic Agent, etc.).
- `/engine`: Bộ máy chạy giả lập `backtest_runner.js`.
- `/results`: Nơi lưu trữ các báo cáo hiệu suất sau mỗi lần chạy.

## 🚀 Quy trình 6 bước thực thi

### Bước 1: Trích xuất Dữ liệu (The Ingestion)
Chạy script `scripts/export_market_data.js` (nếu có) hoặc dùng SQL Editor trên Supabase để xuất bảng `market_data` ra file `history_2025.csv` và lưu vào thư mục `/data`.

### Bước 2: Thiết lập Tham số Giả lập
Mở `engine/backtest_runner.js` và điều chỉnh các thông số:
- `SPREAD`: Phí sàn (ví dụ 1.2 pips).
- `SLIPPAGE`: Độ trượt giá giả lập.
- `INITIAL_BALANCE`: Số dư ban đầu.

### Bước 3: Chạy Giả lập
Thực thi lệnh:
```bash
node engine/backtest_runner.js
```

### Bước 4: Kiểm tra Nhật ký (Audit Trail)
Review các file log trong `/results` để hiểu lý do AI vào lệnh hoặc từ chối lệnh.

### Bước 5: Đánh giá Chỉ số Sống còn
Tập trung vào:
- **Profit Factor**: Mục tiêu > 1.8
- **Max Drawdown**: Mục tiêu < 15%
- **Win Rate**: Tỷ lệ thắng thực tế sau khi trừ phí.

### Bước 6: Tối ưu hóa
Chỉ nâng cấp lên Railway khi kết quả Backtest trên Local vượt trội hơn phiên bản v1.8 hiện tại.

---
🛡️ **Powered by Quantix Core AI - Lab Division**
