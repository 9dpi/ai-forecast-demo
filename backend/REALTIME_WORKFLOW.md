# WORKFLOW: AI REAL-TIME PRICE SCANNER (Backend Engine)

Đây là tài liệu đặc tả kỹ thuật cho quy trình xử lý ngầm (Backend Workflow).

## Bước 1: Data Ingestion (Lấy dữ liệu "tươi")
- **Source:** Yahoo Finance (Free/Backup), AI Vision Scraper (Primary), hoặc OANDA (Future Integration).
- **Timeframe:** 15m, 1h.
- **Cơ chế:** Vòng lặp vô hạn (Infinite Loop) với độ trễ 60s/lần quét.

## Bước 2: AI Inference (Phân tích & Dự báo)
- **Feature Engineering:**
    - Tính RSI (14).
    - Tính Bollinger Bands (20, 2).
    - Tính MA (50, 200).
- **AI Logic:**
    - Input: Giá OHLCV + Indicators.
    - Logic: Nếu (RSI < 30 & Price chạm Lower Band & Xu hướng MA tăng) => Tín hiệu MUA. (Đây là logic heuristic tạm thời trước khi load Model Deep Learning).
- **Signal Generation:**
    - Tính Entry: Giá hiện tại (Close Price).
    - Tính ATR (Average True Range) để đo độ biến động.
    - Tính SL (Stop Loss): Entry - 2 * ATR.
    - Tính TP (Take Profit): Entry + 4 * ATR (Ratio 1:2).

## Bước 3: Live Monitoring & Notification
- **Database:** Lưu tín hiệu vào bảng `ai_signals` với trạng thái `ACTIVE`.
- **Telegram Bot:** Gửi Alert ngay lập tức: "🚨 SIGNAL ALERT: BUY EUR/USD @ 1.0500".
- **Price Checker (The "Watchdog"):**
    - Liên tục so sánh Current Price với TP và SL của các tín hiệu `ACTIVE`.
    - Nếu Hit TP -> Update DB `PROFIT` -> Báo Telegram "💰 Target Hit!".
    - Nếu Hit SL -> Update DB `LOSS` -> Báo Telegram "🛑 Stop Loss Hit".

## Bước 4: Reporting
- Ghi log hiệu suất để hiển thị lên Dashboard "Testimonials/Transparent Performance".
