# OANDA API Setup Guide

## Bước 1: Đăng ký tài khoản OANDA Practice (Miễn phí)

1. Truy cập: https://www.oanda.com/register/#/sign-up/demo
2. Đăng ký tài khoản **Practice** (Demo) - Hoàn toàn miễn phí
3. Xác nhận email

## Bước 2: Lấy API Key

1. Đăng nhập vào OANDA
2. Vào **Manage API Access**: https://www.oanda.com/account/tpa/personal_token
3. Bấm **Generate** để tạo Personal Access Token
4. **Copy** token này (chỉ hiện 1 lần duy nhất)

## Bước 3: Lấy Account ID

1. Vào **My Account**: https://www.oanda.com/account/statement/
2. Nhìn vào URL hoặc phần Account Details
3. Account ID có dạng: `101-004-XXXXXXXX-001`

## Bước 4: Cấu hình vào Project

### Cách 1: Local Development (Máy tính của bạn)

Thêm vào file `.env`:

```
OANDA_API_KEY=your_personal_access_token_here
OANDA_ACCOUNT_ID=101-004-XXXXXXXX-001
TELEGRAM_TOKEN=your_telegram_bot_token (optional)
TELEGRAM_CHAT_ID=your_chat_id (optional)
```

### Cách 2: GitHub Actions (Production)

Vào Repository Settings → Secrets → Actions, thêm:
- `OANDA_API_KEY`
- `OANDA_ACCOUNT_ID`
- `TELEGRAM_TOKEN` (Tùy chọn)
- `TELEGRAM_CHAT_ID` (Tùy chọn)

## Bước 5: Chạy Price Watchdog

```bash
node backend/price_watchdog.js
```

## Lưu ý quan trọng

- **Practice Account** có giá giống Real-time nhưng không tốn tiền thật
- Giá từ OANDA khớp 100% với TradingView (cùng nguồn dữ liệu)
- Rate Limit: 120 requests/phút (quá đủ cho việc check mỗi 10 giây)

## Telegram Bot Setup (Tùy chọn)

1. Tìm @BotFather trên Telegram
2. Gửi `/newbot` và làm theo hướng dẫn
3. Copy **Token** (dạng: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
4. Tìm @userinfobot để lấy **Chat ID** của bạn
5. Thêm vào `.env` hoặc GitHub Secrets

## Kiểm tra kết nối

Sau khi cấu hình xong, chạy:

```bash
node backend/price_watchdog.js
```

Nếu thành công, bạn sẽ thấy:
```
🚀 Starting Price Watchdog for EUR/USD...
   Data Source: OANDA (Synced with TradingView)
📊 OANDA EUR/USD: 1.0542
🔍 Watching 2 signals | Current Price: 1.0542
```

## Troubleshooting

**Lỗi "OANDA API Error 401":**
- Kiểm tra lại API Key có đúng không
- Đảm bảo bạn dùng Practice Account URL

**Lỗi "Cannot fetch current price":**
- Hệ thống sẽ tự động fallback sang Yahoo Finance
- Vẫn hoạt động bình thường nhưng giá có thể chậm hơn 15-20 giây
