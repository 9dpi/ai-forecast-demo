# ✅ CHECKLIST SETUP GITHUB ACTIONS WATCHDOG

## 📋 **Bước 1: Thêm Secrets vào GitHub**

1. Mở: https://github.com/9dpi/ai-forecast-demo/settings/secrets/actions
2. Click **"New repository secret"** và thêm **8 secrets** sau:

| Secret Name | Value (Copy từ .env) |
|-------------|----------------------|
| `DB_HOST` | `aws-1-ap-south-1.pooler.supabase.com` |
| `DB_NAME` | `postgres` |
| `DB_USER` | `postgres.gvglzvjsexeaectypkyk` |
| `DB_PASSWORD` | `EpVgJ9G%-EQA.Qm` |
| `DB_PORT` | `6543` |
| `ALPHA_VANTAGE_KEY` | `Z9JGV0STF4PE6C61` |
| `TELEGRAM_TOKEN` | `AAEwGwcVzzbNOSLj-P_V80ReaIreSvKzWuY` |
| `TELEGRAM_CHAT_ID` | `7985984228` |

**Lưu ý:** Nhớ click **"Add secret"** sau mỗi cái.

---

## 🚀 **Bước 2: Push code lên GitHub**

Code workflow đã được sửa, giờ push lên:

```bash
git add .
git commit -m "Update workflow to manual control only"
git push
```

---

## ▶️ **Bước 3: Chạy Watchdog trên GitHub**

1. Vào: https://github.com/9dpi/ai-forecast-demo/actions
2. Click workflow: **"AI Price Watchdog (Manual Control)"**
3. Click nút **"Run workflow"** (góc phải) → Click **"Run workflow"** (xác nhận)
4. Đợi ~30 giây, workflow sẽ bắt đầu chạy

---

## 🔍 **Bước 4: Kiểm tra Log**

1. Click vào workflow đang chạy (màu vàng/xanh)
2. Click job **"watchdog"**
3. Xem log real-time:
   ```
   📊 Alpha Vantage EUR/USD: 1.1654
   📍 Updated price for Signal xxx: 1.1654
   ```

---

## 🛑 **Cách TẮT Watchdog**

**Cách 1: Đợi tự động dừng (6 tiếng)**
- Workflow sẽ tự dừng sau 360 phút (6h)

**Cách 2: Dừng thủ công ngay**
1. Vào Actions → Click workflow đang chạy
2. Click **"Cancel workflow"** (góc phải)

---

## ♻️ **Cách BẬT lại**

Lặp lại **Bước 3** (Click "Run workflow")

---

## ⚠️ **Lưu ý quan trọng**

1. **Sau khi setup xong trên GitHub, anh có thể:**
   - Tắt local watchdog: `Ctrl + C`
   - Tắt máy đi ngủ thoải mái
   - Web vẫn chạy từ GitHub Actions

2. **Quota:**
   - Free: 2,000 phút/tháng
   - 1 lần chạy: ~360 phút (6h)
   - Tối đa: ~5 lần chạy/tháng

3. **Telegram Alerts:**
   - Vẫn hoạt động bình thường từ GitHub Actions
   - Sẽ nhận thông báo khi TP/SL hit

---

## ✅ **Xác nhận thành công**

Sau khi chạy workflow, kiểm tra:
- ✅ Log GitHub hiện giá cập nhật mỗi 10s
- ✅ Web https://9dpi.github.io/ai-forecast-demo/#/mvp hiện giá mới
- ✅ Telegram nhận được test message (nếu có)

**Hoàn tất!** 🎉
