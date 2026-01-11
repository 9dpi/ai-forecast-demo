# ⏰ AUTOMATED SCHEDULER SETUP GUIDE

**Mục đích:** Tự động chạy Gold ingestion lúc 16:00 và Full 10-year ingestion lúc 20:00

---

## 🚀 OPTION 1: CHẠY SCHEDULER SCRIPT (RECOMMENDED)

### Bước 1: Start Scheduler
```bash
node scripts/scheduler.js
```

**Kết quả:**
```
⏰ Scheduler started. Monitoring tasks...

📅 Gold Rush - 3 Years scheduled at 16:00
📅 Full 10-Year Ingestion scheduled at 20:00

⏳ Waiting for scheduled time...
```

### Bước 2: Để chạy ngầm
- **Windows:** Mở terminal mới, để cửa sổ này chạy
- **Hoặc:** Dùng Windows Task Scheduler (xem Option 2)

---

## 🪟 OPTION 2: WINDOWS TASK SCHEDULER (TỰ ĐỘNG HOÀN TOÀN)

### Task 1: Gold Ingestion (16:00)

1. **Mở Task Scheduler:**
   - Nhấn `Win + R` → gõ `taskschd.msc` → Enter

2. **Create Basic Task:**
   - Name: `Quantix - Gold Ingestion`
   - Description: `Nạp 3 năm dữ liệu XAU/USD`

3. **Trigger:**
   - Daily
   - Start: `Today at 16:00`
   - Recur every: `1 days`

4. **Action:**
   - Program: `C:\Program Files\nodejs\node.exe`
   - Arguments: `scripts/data-ingest-bulk.js --years=3 --assets=XAUUSD`
   - Start in: `d:\Automator_Prj\AI_Smart_Forecast_Comercial`

5. **Finish** → ✅ Task created

---

### Task 2: Full 10-Year Ingestion (20:00)

1. **Create Basic Task:**
   - Name: `Quantix - Full Ingestion`
   - Description: `Nạp 10 năm dữ liệu EURUSD + XAUUSD + GBPUSD`

2. **Trigger:**
   - Daily
   - Start: `Today at 20:00`
   - Recur every: `1 days`

3. **Action:**
   - Program: `C:\Program Files\nodejs\node.exe`
   - Arguments: `scripts/data-ingest-bulk.js --years=10 --assets=EURUSD,XAUUSD,GBPUSD`
   - Start in: `d:\Automator_Prj\AI_Smart_Forecast_Comercial`

4. **Finish** → ✅ Task created

---

## 🎯 OPTION 3: CHẠY THỦ CÔNG (ONE-TIME)

### Lúc 16:00 - Gold Rush
```bash
npm run data:ingest:bulk -- --years=3 --assets=XAUUSD
```

### Lúc 20:00 - Full 10-Year
```bash
npm run data:ingest:bulk -- --years=10 --assets=EURUSD,XAUUSD,GBPUSD
```

---

## 📊 MONITORING

### Kiểm tra Task Scheduler logs:
1. Task Scheduler → Task Scheduler Library
2. Tìm task `Quantix - Gold Ingestion`
3. Tab **History** → Xem execution logs

### Kiểm tra kết quả:
```bash
# Sau khi task chạy xong
npm run data:validate

# Xem số lượng records
# Supabase Dashboard → Table Editor → market_data
```

---

## ⚡ QUICK START (NGAY BÂY GIỜ)

**Nếu muốn tự động hóa ngay:**
```bash
# Start scheduler script (để chạy ngầm)
node scripts/scheduler.js
```

**Hoặc chạy thủ công khi cần:**
```bash
# Test ngay với 1 năm Gold
npm run data:ingest:bulk -- --years=1 --assets=XAUUSD
```

---

## 🛡️ TROUBLESHOOTING

### ❌ Task không chạy
**Giải pháp:**
- Kiểm tra Task Scheduler → Task đã enabled chưa
- Verify đường dẫn `node.exe` (chạy `where node` trong CMD)
- Check Start in directory

### ❌ Script chạy nhưng không có data
**Giải pháp:**
- Kiểm tra Yahoo Finance rate limit (đợi 1-2 giờ)
- Xem logs trong terminal
- Chạy `npm run db:check` để test connection

---

## 📅 TIMELINE HÔM NAY

```
14:45 ✅ Setup scheduler
16:00 ⏳ Gold ingestion (auto)
17:00 ✅ Validate Gold data
20:00 ⏳ Full 10-year ingestion (auto)
22:00 ✅ Validate all data
23:00 🎉 System fully loaded
```

---

**Khuyến nghị:** Dùng **Option 1** (scheduler script) để linh hoạt, hoặc **Option 2** (Task Scheduler) để tự động hoàn toàn.

**Status:** ✅ Ready to automate  
**Next:** Start scheduler hoặc setup Task Scheduler
