# QUANTIX LIFECYCLE SERVICE - RAILWAY DEPLOYMENT GUIDE
# Hướng dẫn đơn giản để verify và deploy lifecycle service

## CÁCH 1: VERIFY QUA RAILWAY DASHBOARD (NHANH NHẤT)

1. Mở browser: https://railway.app/
2. Login vào account
3. Chọn project "Quantix Core AI"
4. Kiểm tra xem có service tên "lifecycle" không

### Nếu ĐÃ CÓ service "lifecycle":
- Click vào service đó
- Check tab "Deployments" - xem có deployment mới nhất không
- Check tab "Logs" - xem có log "🚀 QUANTIX SIGNAL LIFECYCLE MANAGER" không
- Nếu có → ✅ DONE! Service đã chạy
- Nếu không có logs → Service cần restart

### Nếu CHƯA CÓ service "lifecycle":
Làm theo hướng dẫn CÁCH 2 bên dưới

---

## CÁCH 2: TẠO SERVICE MỚI TRÊN RAILWAY (5 PHÚT)

### Bước 1: Thêm service
1. Trong project dashboard, click "New" → "Empty Service"
2. Đặt tên: `lifecycle`

### Bước 2: Connect GitHub
1. Click vào service vừa tạo
2. Settings → "Connect Repo"
3. Chọn repo: `9dpi/quantix`
4. Branch: `main`

### Bước 3: Cấu hình
1. Settings → "Start Command"
   ```
   node backend/signal_lifecycle_manager.js
   ```

2. Settings → "Root Directory" (nếu cần)
   ```
   /
   ```

3. Variables → "Reference Variables"
   - Chọn "Reference all variables from service: web" (hoặc service khác đang chạy)
   - Hoặc thêm thủ công:
     - DB_HOST
     - DB_USER
     - DB_PASSWORD
     - DB_NAME
     - DB_PORT
     - TELEGRAM_TOKEN
     - TELEGRAM_CHAT_ID

### Bước 4: Deploy
1. Click "Deploy" hoặc Railway sẽ auto-deploy
2. Đợi 1-2 phút
3. Check logs để verify

---

## CÁCH 3: SỬ DỤNG RAILWAY.JSON (TỰ ĐỘNG)

Railway sẽ tự động detect file `railway.json` trong repo.
File này đã được tạo sẵn, nhưng cần update để include lifecycle service.

Nếu bạn muốn, tôi có thể update file `railway.json` để Railway tự động tạo service.

---

## VERIFY SERVICE ĐANG CHẠY

Sau khi deploy, check logs sẽ thấy:

```
🚀 QUANTIX SIGNAL LIFECYCLE MANAGER v1.8.2
⏱️  TTL: 3 hours
🔄 Check Interval: 5 minutes
📡 Telegram Alerts: ENABLED ✅

============================================================
[TIME] 🔄 SIGNAL LIFECYCLE CHECK
============================================================
🔍 Monitoring X active signals...
```

---

## TROUBLESHOOTING

### Service không start:
- Check "Variables" tab - đảm bảo có đủ DB credentials
- Check "Logs" tab - xem error message

### Logs không hiện gì:
- Service có thể đang sleep
- Đợi 5 phút (1 cycle) để xem logs mới

### Database connection error:
- Verify DB_HOST, DB_USER, DB_PASSWORD
- Check Supabase dashboard xem database có online không

---

**Bạn đang ở bước nào, CTO? Tôi sẽ hỗ trợ cụ thể hơn!**
