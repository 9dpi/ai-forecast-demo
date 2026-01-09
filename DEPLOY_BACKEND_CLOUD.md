# 🚀 HƯỚNG DẪN DEPLOY BACKEND LÊN GITHUB ACTIONS (Cloud 24/7)

## 📋 **Tổng quan**
Thay vì chạy `price_watchdog.js` trên máy local, chúng ta sẽ dùng **GitHub Actions** để:
- ✅ Chạy backend trên cloud miễn phí
- ✅ Tự động restart mỗi 6 tiếng
- ✅ Không cần để máy bật

---

## ⚙️ **Bước 1: Cấu hình GitHub Secrets**

1. Vào repository: https://github.com/9dpi/ai-forecast-demo
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** và thêm các secret sau:

| Secret Name | Value |
|-------------|-------|
| `DB_HOST` | `aws-1-ap-south-1.pooler.supabase.com` |
| `DB_NAME` | `postgres` |
| `DB_USER` | `postgres.gvglzvjsexeaectypkyk` |
| `DB_PASSWORD` | `EpVgJ9G%-EQA.Qm` |
| `DB_PORT` | `6543` |
| `ALPHA_VANTAGE_KEY` | `Z9JGV0STF4PE6C61` |
| `TELEGRAM_TOKEN` | `AAEwGwcVzzbNOSLj-P_V80ReaIreSvKzWuY` |
| `TELEGRAM_CHAT_ID` | `7985984228` |

*(Copy từ file `.env` hiện tại)*

---

## ▶️ **Bước 2: Kích hoạt Workflow**

### Cách 1: Chạy thủ công (Recommended)
1. Vào **Actions** tab trên GitHub
2. Click workflow **"AI Price Watchdog (Real-time)"**
3. Click nút **"Run workflow"** → **"Run workflow"**
4. Watchdog sẽ chạy trong ~6 tiếng rồi tự restart

### Cách 2: Tự động (Continuous)
File `.github/workflows/watchdog.yml` đã được cấu hình:
- Tự động chạy lại **mỗi 6 tiếng** (`cron: '0 */6 * * *'`)
- Timeout: 350 phút/lần (để restart trước khi GitHub kill)

---

## 🔍 **Bước 3: Kiểm tra hoạt động**

1. Vào **Actions** → Click vào workflow đang chạy
2. Xem log real-time:
   ```
   📊 Alpha Vantage EUR/USD: 1.1654
   📍 Updated price for Signal xxx: 1.1654
   ```

3. Kiểm tra web: https://9dpi.github.io/ai-forecast-demo/#/mvp
   - Giá phải cập nhật mỗi ~10 giây

---

## ⚠️ **Lưu ý quan trọng**

### Giới hạn GitHub Actions (Free Tier)
- **2,000 phút/tháng** miễn phí
- Watchdog chạy liên tục: ~350 phút/lần × 4 lần/ngày = **1,400 phút/ngày**
- **Sẽ hết quota sau ~1.4 ngày**

### 💡 Giải pháp tiết kiệm quota:
Có 2 lựa chọn:

#### **Option A: Chạy theo giờ cao điểm**
Sửa `cron` trong `watchdog.yml`:
```yaml
schedule:
  - cron: '0 1,7,13,19 * * *'  # Chỉ chạy 4 lần/ngày (1h, 7h, 13h, 19h UTC)
```
**Ưu điểm:** Tiết kiệm quota (chỉ ~200 phút/ngày)  
**Nhược điểm:** Giá chỉ update 4 lần/ngày

#### **Option B: Deploy lên Render.com (Recommended)**
- Miễn phí 750h/tháng
- Chạy liên tục 24/7 không giới hạn
- Tôi có thể setup cho anh ngay

---

## 🚫 **Tắt Local Watchdog**

Sau khi GitHub Actions chạy thành công, anh có thể:
```bash
# Dừng watchdog trên local
Ctrl + C

# Tắt máy đi ngủ thoải mái
# Web vẫn sẽ cập nhật giá từ GitHub Actions
```

---

## 🔄 **Luồng dữ liệu mới (Full Cloud)**

```
GitHub Actions (Cloud)
    ↓ (chạy price_watchdog.js)
Alpha Vantage API
    ↓ (mỗi 10s)
Supabase Database (Cloud)
    ↓ (Realtime)
GitHub Pages (Cloud)
    ↓
Người dùng thấy giá real-time
```

**100% Cloud - Không phụ thuộc máy local!** ✅

---

## 🎯 **Khuyến nghị**

Nếu anh muốn hệ thống **thực sự Production 24/7**, tôi khuyến cáo:

1. **Ngắn hạn (Hôm nay):** Dùng GitHub Actions với `cron` 4-6 tiếng/lần
2. **Dài hạn (Tuần sau):** Deploy lên **Render.com** hoặc **Railway.app** (free tier)

Anh muốn tôi setup cái nào trước ạ?
