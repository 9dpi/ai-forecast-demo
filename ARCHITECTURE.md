# Quantix AI v1.9.3 - Service Architecture Documentation
# Created: 2026-01-13
# Status: STABLE - Ready for Service Decoupling

## 📋 CURRENT SERVICE ARCHITECTURE (Before Decoupling)

### Service Overview
| Service Name | Start Command | Status | RAM Usage | Purpose |
|--------------|---------------|--------|-----------|---------|
| `web` | `node backend/server.js` | ✅ ONLINE | ~40 MB | API & Health Check |
| `bot-v19-xịn` | `node backend/services/telegram_bot_v1.9.js` | ✅ ONLINE | ~65 MB | Telegram Bot Interface |
| `quantix` | `node backend/scanner_engine.js` | ✅ ONLINE | ~80 MB | Market Scanner + AI |
| `lifecycle` | `node backend/signal_lifecycle_manager.js` | ✅ ONLINE | ~35 MB | Signal Lifecycle Manager |
| `scheduler` | `node backend/telegram_scheduler.js` | ✅ ONLINE | ~30 MB | Scheduled Notifications |

**Total RAM Usage**: ~250 MB / 500 MB (50% capacity)

---

## 🏗️ PROPOSED DECOUPLED ARCHITECTURE

### Service 1: Quantix-Scanner
**Purpose**: Market data collection and AI signal generation
**Start Command**: `node backend/scanner_engine.js`
**Required Variables**:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `MIN_CONFIDENCE_THRESHOLD`

**Resource Allocation**: 
- RAM: 512 MB (dedicated for AI processing)
- CPU: Medium priority

---

### Service 2: Quantix-Bot
**Purpose**: User interaction and command handling
**Start Command**: `node backend/services/telegram_bot_v1.9.js`
**Required Variables**:
- `TELEGRAM_BOT_TOKEN`
- `GROUP_ID_VIP`, `GROUP_ID_OFFICIAL`, `GROUP_ID_COMMUNITY`
- `PATTERN_CACHE_MODE=LOCAL`

**Resource Allocation**:
- RAM: 256 MB (for pattern cache)
- CPU: High priority (for fast response)

---

### Service 3: Quantix-Sentinel
**Purpose**: Signal lifecycle management and monitoring
**Start Command**: `node backend/signal_lifecycle_manager.js`
**Required Variables**:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- `TELEGRAM_TOKEN`, `TELEGRAM_CHAT_ID`

**Resource Allocation**:
- RAM: 128 MB (lightweight)
- CPU: Low priority (runs every 5 minutes)

---

### Service 4: Quantix-Scheduler
**Purpose**: Automated daily reports and market pulse
**Start Command**: `node backend/telegram_scheduler.js`
**Required Variables**:
- `TELEGRAM_TOKEN`
- `GROUP_ID_VIP`, `GROUP_ID_OFFICIAL`, `GROUP_ID_COMMUNITY`

**Resource Allocation**:
- RAM: 128 MB
- CPU: Low priority (cron-based)

---

### Service 5: Quantix-Web
**Purpose**: Dashboard API and health monitoring
**Start Command**: `node backend/server.js`
**Required Variables**:
- `PORT=3000`
- `NODE_ENV=production`

**Resource Allocation**:
- RAM: 128 MB
- CPU: Medium priority

---

## 🔄 INTER-SERVICE COMMUNICATION

```
┌─────────────────┐
│  Quantix-Scanner│
│  (AI Engine)    │
└────────┬────────┘
         │ Writes signals to DB
         ▼
    ┌────────────┐
    │ PostgreSQL │◄──────┐
    │  Database  │       │
    └────┬───────┘       │
         │               │
         │ Reads signals │
         ▼               │
┌─────────────────┐      │
│ Quantix-Sentinel│      │
│ (Lifecycle Mgr) │      │
└─────────────────┘      │
                         │
┌─────────────────┐      │
│  Quantix-Bot    │──────┘
│ (User Interface)│ Reads patterns & signals
└─────────────────┘
```

---

## ✅ PRE-DECOUPLING CHECKLIST

- [x] Git tag created: `v1.9.3-stable`
- [x] Backup metadata documented
- [x] Pattern cache file secured (6.4 MB)
- [x] Database backup script created
- [ ] Database export executed
- [ ] Service separation on Railway
- [ ] Cross-service communication verified
- [ ] Load testing completed

---

## 🚨 ROLLBACK PROCEDURE

If decoupling causes issues:

1. **Immediate Rollback**:
   ```bash
   git checkout v1.9.3-stable
   git push origin main --force
   ```

2. **Railway Revert**:
   - Delete new services
   - Restore original `Procfile` configuration
   - Redeploy from `v1.9.3-stable` tag

3. **Database Restore** (if needed):
   ```bash
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME < RecoveryVault/backup_pattern_cache_20260113.sql
   psql -h $DB_HOST -U $DB_USER -d $DB_NAME < RecoveryVault/backup_ai_signals_20260113.sql
   ```

---

## 📊 MONITORING METRICS

After decoupling, monitor:
- Response time for `/vip` command (target: <500ms)
- Scanner cycle completion time (target: <5s per asset)
- Database connection pool usage
- RAM usage per service
- API rate limits (Yahoo Finance)

---

**Last Updated**: 2026-01-13T11:42:00+07:00
**Status**: READY FOR DECOUPLING
**Approved By**: CTO
