# ⚡ RAILWAY HOBBY PLAN - OPTIMIZATION GUIDE

**Ngày cập nhật:** 2026-01-11  
**Gói dịch vụ:** Hobby Plan ($5/month)  
**Tài nguyên:** 8 vCPU, 8GB RAM

---

## 🎯 MỤC TIÊU

Tận dụng tối đa sức mạnh của Hobby Plan để:
1. **Giảm độ trễ** (Polling interval: 10s → 5s)
2. **Tăng độ chính xác** (Historical lookback với 10 năm dữ liệu)
3. **Mở rộng phạm vi** (Multi-asset monitoring)

---

## 🔧 BƯỚC 1: CẤU HÌNH ENVIRONMENT VARIABLES

### Truy cập Railway Dashboard

1. Mở https://railway.app/dashboard
2. Chọn project **Quantix Core**
3. Vào tab **Variables**

### Thêm/Cập nhật các biến sau:

```env
# ⚡ High-Frequency Mode
POLLING_INTERVAL=5000
# Giải thích: Quét thị trường mỗi 5 giây (thay vì 10s)
# Lợi ích: Phát hiện tín hiệu nhanh hơn, không bỏ lỡ cơ hội

# 🧠 Deep Learning Mode
ENABLE_DEEP_LEARNING=true
# Giải thích: Kích hoạt chế độ học sâu (sử dụng historical data)
# Lợi ích: AI confidence score chính xác hơn

# 📊 Multi-Asset Support
MONITORED_SYMBOLS=EURUSD=X,GC=F,GBPUSD=X
# Giải thích: Theo dõi nhiều cặp tiền cùng lúc
# Lợi ích: Đa dạng hóa cơ hội giao dịch

# 🔔 Alert Threshold
MIN_CONFIDENCE_SCORE=85
# Giải thích: Chỉ gửi alert khi AI confidence >= 85%
# Lợi ích: Giảm nhiễu, tập trung vào tín hiệu chất lượng cao
```

### Lưu ý quan trọng:

⚠️ **Sau khi thay đổi biến môi trường, Railway sẽ tự động restart deployment.**

---

## 🦅 BƯỚC 2: CHIẾN DỊCH ĐẠI BÀNG (BULK DATA INGESTION)

### Mục tiêu:
Nạp **10 năm dữ liệu lịch sử** (2016-2026) cho các cặp tiền chính.

### Khối lượng dự kiến:
- **EURUSD:** ~250,000 nến (M15)
- **XAUUSD (Gold):** ~250,000 nến
- **GBPUSD:** ~250,000 nến
- **Tổng:** ~750,000 nến

### Thực thi:

**Trên máy local (Khuyến nghị):**
```bash
# Nạp 10 năm cho EURUSD
npm run data:ingest:bulk -- --years=10 --assets=EURUSD

# Nạp 10 năm cho nhiều cặp tiền
npm run data:ingest:bulk -- --years=10 --assets=EURUSD,XAUUSD,GBPUSD
```

**Hoặc trên Railway (Nếu muốn chạy trên cloud):**
1. Vào tab **Deployments**
2. Click **Deploy** → **Run Command**
3. Nhập: `npm run data:ingest:bulk -- --years=10 --assets=EURUSD`

### Thời gian dự kiến:
- **1 cặp tiền (10 năm):** ~15-20 phút
- **3 cặp tiền:** ~45-60 phút

### Giám sát tiến trình:
```
🦅 Processing EURUSD (10 years)...
   EURUSD 2016: Fetching... ✅ 24,532 candles
   EURUSD 2017: Fetching... ✅ 25,104 candles
   ...
   ✅ EURUSD complete: 250,000 total candles
```

---

## 📊 BƯỚC 3: XÁC NHẬN KẾT QUẢ

### Kiểm tra dữ liệu:
```bash
npm run data:validate
```

**Kết quả mong đợi:**
```
📊 CHECK 1: DATA COVERAGE
   Total Candles:  750,000+
   Coverage: 95%+
   ✅ Excellent coverage!

🎯 DATA QUALITY HEALTH SCORE
   Final Score: 95/100
   Rating: 🟢 Excellent
```

### Kiểm tra Railway logs:
```
🚀 Starting Price Watchdog...
   Check Interval: Every 5 seconds
   Mode: ⚡ HIGH-FREQUENCY
```

---

## 🚀 BƯỚC 4: KÍCH HOẠT DEEP LEARNING

Sau khi có đủ dữ liệu lịch sử, AI sẽ tự động:
1. **Phân tích mẫu hình** (Pattern Recognition)
2. **Tính xác suất thắng** (Win Rate Calculation)
3. **Điều chỉnh Confidence Score** (Dynamic Scoring)

**Ví dụ:**
- **Trước:** AI phát hiện mẫu "Double Bottom" → Confidence: 70%
- **Sau:** AI tra cứu 10 năm lịch sử → Tìm thấy 150 lần mẫu tương tự → 85% thắng → **Confidence: 92%**

---

## 📈 KẾT QUẢ MONG ĐỢI

### Trước nâng cấp:
- Polling: 10 giây
- Data: 1 năm (~6,000 nến)
- Symbols: 1 (EURUSD)
- Accuracy: ~70%

### Sau nâng cấp:
- Polling: **5 giây** ⚡
- Data: **10 năm** (~750,000 nến) 🦅
- Symbols: **3+** (EURUSD, XAUUSD, GBPUSD)
- Accuracy: **85%+** 🎯

---

## 🛡️ LƯU Ý AN TOÀN

1. **Backup trước khi chạy bulk ingestion:**
   ```bash
   node scripts/backup_data.js
   ```

2. **Monitor Railway resource usage:**
   - CPU không vượt quá 80%
   - Memory không vượt quá 6GB

3. **Rate limiting:**
   - Yahoo Finance có giới hạn ~2000 requests/hour
   - Script đã tích hợp delay 1 giây giữa các năm

---

## 📞 TROUBLESHOOTING

### ❌ Lỗi: "Rate limit exceeded"
**Giải pháp:** Tăng delay trong script hoặc chạy vào giờ thấp điểm (2-4 AM UTC).

### ❌ Lỗi: "Memory limit exceeded"
**Giải pháp:** Giảm BATCH_SIZE từ 1000 xuống 500 trong script.

### ❌ Lỗi: "Connection timeout"
**Giải pháp:** Kiểm tra Supabase status: https://status.supabase.com

---

## 🎉 KẾT LUẬN

Với Hobby Plan, Quantix Core giờ đây là một **High-Performance Trading System** thực thụ:
- ⚡ Phản ứng nhanh (5 giây)
- 🧠 Thông minh hơn (10 năm kinh nghiệm)
- 🌍 Rộng hơn (Multi-asset)

**Chúc bạn gặt hái thành công! 🚀💰**

---

**Tài liệu tham khảo:**
- Railway Docs: https://docs.railway.app/
- Supabase Docs: https://supabase.com/docs
- Yahoo Finance API: https://finance.yahoo.com/
