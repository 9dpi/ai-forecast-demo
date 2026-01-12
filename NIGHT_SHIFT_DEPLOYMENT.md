# QUANTIX CORE V1.8.2 - NIGHT SHIFT DEPLOYMENT PLAN
## "Tổng động viên kỹ thuật" - Active Communication Layer

**Thời gian thực hiện:** 12/01/2026 23:00 - 13/01/2026 05:30
**Mục tiêu:** Biến hệ thống thành "Trợ lý tận tâm 24/7" cho khách hàng VIP

---

## ✅ PHASE 1: SIGNAL LIFECYCLE MANAGEMENT (23:00 - 01:00)

### Đã hoàn thành:
1. **Signal Lifecycle Manager** (`backend/signal_lifecycle_manager.js`)
   - TTL Tracking: 3 giờ cho mỗi tín hiệu
   - Auto-expiration với thông báo Telegram
   - Monitoring chu kỳ 5 phút
   - Tích hợp vào Procfile (service: `lifecycle`)

2. **Enhanced Telegram Templates** (`backend/price_watchdog.js`)
   - Entry Hit: Hiển thị đầy đủ TP/SL, nhấn mạnh monitoring real-time
   - TP1 Hit: Khuyến nghị di chuyển SL về Entry
   - TP2 Hit: Thông báo hoàn thành với branding Quantix v1.8.2
   - SL Hit: Thông điệp tích cực về quản lý rủi ro

---

## 🔄 PHASE 2: API PRICE SYNC (01:00 - 03:00)

### Kế hoạch:
- [ ] Kiểm tra độ chính xác của Yahoo Finance vs TradingView
- [ ] Đánh giá khả năng tích hợp OANDA v20 API
- [ ] Chuẩn hóa giá Mid (Bid/Ask average)
- [ ] Test độ trễ và spread accuracy

**Note:** Hiện tại đang dùng Yahoo Finance với fallback Alpha Vantage. Cần đánh giá xem có cần nâng cấp lên OANDA không.

---

## 📊 PHASE 3: STRESS TEST (03:00 - 05:30)

### Kế hoạch:
- [ ] Tạo 10 tín hiệu test trong database
- [ ] Verify lifecycle manager tự động expire sau 3h
- [ ] Kiểm tra Telegram notifications
- [ ] Monitor system performance

---

## 🚀 DEPLOYMENT CHECKLIST

### Railway Services cần deploy:
1. ✅ `web` - Dashboard API
2. ✅ `worker` - Price Watchdog
3. ✅ `scanner` - Signal Scanner
4. ✅ `bot` - Telegram Bot
5. ✅ `scheduler` - Telegram Scheduler
6. **🆕 `lifecycle`** - Signal Lifecycle Manager

### Environment Variables:
- Đã cấu hình: MIN_CONFIDENCE_THRESHOLD=0.85
- Cần verify: TELEGRAM_TOKEN, TELEGRAM_CHAT_ID

---

## 📝 NEXT STEPS

1. **Test Lifecycle Manager locally:**
   ```bash
   node backend/signal_lifecycle_manager.js
   ```

2. **Deploy to Railway:**
   - Push code to GitHub
   - Railway sẽ auto-deploy
   - Activate `lifecycle` service

3. **Monitor for 24h:**
   - Kiểm tra Telegram alerts
   - Verify expiration logic
   - Track system stability

---

**Status:** Phase 1 Complete ✅ | Ready for Phase 2 Testing
**Next Review:** 13/01/2026 06:00
