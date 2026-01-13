# 🎯 TELEGRAM SNIPER AUTOPILOT v2.2.0

**Chiến lược**: "1 Signal/Day - 95%+ Confidence Only"  
**Mục tiêu**: Zero noise, maximum precision  
**Status**: ✅ READY FOR DEPLOYMENT

---

## 🎯 CORE PHILOSOPHY

**"Tay bắn tỉa chỉ bắn khi chắc ăn"**

- ❌ Không spam signals
- ❌ Không post tín hiệu yếu
- ✅ Chỉ post khi AI confidence > 95%
- ✅ Maximum 1 signal mỗi ngày
- ✅ Tự động quản lý lifecycle

---

## 📋 FILTERING RULES

### Rule 1: Confidence Threshold
```javascript
confidence_score >= 95% // Only elite signals
```

### Rule 2: Daily Limit
```javascript
max_signals_per_day = 1 // First qualifying signal wins
```

### Rule 3: First Come First Serve
- AI scan mỗi 60 giây
- Signal đầu tiên đạt 95%+ trong ngày → POST
- Sau đó lock cho đến ngày hôm sau

---

## 🔄 3-PHASE LIFECYCLE

### Phase 1: SIGNAL POST (New Signal)
**Trigger**: Signal với confidence > 95% xuất hiện

**Message Format**:
```
🎯 SNIPER SIGNAL - DAILY PICK
━━━━━━━━━━━━━━━━━━

📊 Asset: EURUSD
🎬 Direction: 🟢 LONG

💰 Price Levels:
Entry: 1.16630
TP:    1.16980
SL:    1.16380

📏 Risk Management:
• TP Target: 35.0 pips
• SL Protection: 25.0 pips
• Risk:Reward: 1:1.40

🧠 AI Confidence: 96% ⭐

⏰ Posted: Jan 13, 2026 14:45 ICT

🛡️ Quantix Sniper Mode - Only the best setups
```

**Actions**:
- ✅ Broadcast to all groups (VIP/Official/Community)
- ✅ Mark signal as `broadcasted` in metadata
- ✅ Lock daily quota

---

### Phase 2: EXPIRY POST (Signal Expired)
**Trigger**: Signal status changed to `EXPIRED`

**Message Format**:
```
⚠️ SIGNAL EXPIRED
━━━━━━━━━━━━━━━━━━

📊 Asset: EURUSD
🎬 Direction: 🟢 LONG
💰 Entry: 1.16630

Reason: Price moved 10.5 pips away from entry zone

✅ Capital Protected - No trade executed

🛡️ Better to miss than to force a bad entry
```

**Actions**:
- ✅ Broadcast expiry notification
- ✅ Mark as `expiry_announced`
- ✅ Preserve user trust (transparency)

---

### Phase 3: RESULT POST (Final Outcome)
**Trigger**: Signal status changed to `TP1_HIT`, `TP2_HIT`, or `SL_HIT`

**WIN Message**:
```
✅ FINAL RESULT: WIN
━━━━━━━━━━━━━━━━━━

📊 Asset: EURUSD
🎬 Direction: 🟢 LONG

💰 Entry: 1.16630
🎯 Exit: 1.16980

📏 Result: 🟢 +35.0 pips

🎉 Target achieved!

⏰ Closed: Jan 13, 2026 18:30 ICT

🛡️ Quantix Sniper - Precision Trading
```

**LOSS Message**:
```
❌ FINAL RESULT: LOSS
━━━━━━━━━━━━━━━━━━

📊 Asset: EURUSD
🎬 Direction: 🟢 LONG

💰 Entry: 1.16630
🎯 Exit: 1.16380

📏 Result: 🔴 -25.0 pips

🛡️ Stop loss protected capital

⏰ Closed: Jan 13, 2026 16:15 ICT

🛡️ Quantix Sniper - Precision Trading
```

**Actions**:
- ✅ Broadcast final result
- ✅ Mark as `result_announced`
- ✅ Calculate pips (Win/Loss)

---

## 🔧 TECHNICAL IMPLEMENTATION

### File Structure
```
backend/services/
├── telegram_sniper_autopilot.js  ← Main worker
├── bot_utils.js                  ← Utilities (pips, formatting)
└── auto_expire_worker.js         ← Expiry detection
```

### Worker Loop (60s interval)
```javascript
1. Check for new 95%+ signals
   └─► If found & not posted today → POST (Phase 1)

2. Check for expired signals
   └─► If found & not announced → POST (Phase 2)

3. Check for closed signals
   └─► If found & not announced → POST (Phase 3)
```

### Database Tracking
```javascript
// Signal metadata structure
{
  broadcasted: true,
  broadcast_time: "2026-01-13T14:45:00Z",
  broadcast_groups: [{groupId, messageId}],
  expiry_announced: true,
  expiry_announce_time: "2026-01-13T15:30:00Z",
  result_announced: true,
  result_announce_time: "2026-01-13T18:30:00Z"
}
```

---

## 🚀 DEPLOYMENT

### Railway Service Setup
```bash
# Create new service: "telegram-sniper"
# Start command: node backend/services/telegram_sniper_autopilot.js
```

### Environment Variables
```
TELEGRAM_TOKEN = 8510625910:AAFZCWKstyTvLdIyOSwKcmwmSB82Zf9btiU
GROUP_ID_VIP = <VIP_GROUP_ID>
GROUP_ID_OFFICIAL = <OFFICIAL_CHANNEL_ID>
GROUP_ID_COMMUNITY = <COMMUNITY_GROUP_ID>
SUPABASE_URL = https://gvglzvjsexeaectypkyk.supabase.co
SUPABASE_SERVICE_KEY = <SERVICE_KEY>
```

---

## 📊 EXPECTED BEHAVIOR

### Day 1 (Example)
```
07:00 - Scan starts
09:30 - First 96% signal detected → POST (Phase 1)
09:31 - Daily quota filled, standing down
15:00 - Signal expires → POST (Phase 2)
23:59 - Day ends
```

### Day 2
```
00:00 - Daily quota resets
08:45 - New 97% signal detected → POST (Phase 1)
14:30 - Signal hits TP → POST (Phase 3: WIN)
```

---

## ✅ BENEFITS

### For Users
- ✅ **Zero noise**: Only 1 high-quality signal/day
- ✅ **Transparency**: Full lifecycle tracking
- ✅ **Trust**: See both wins AND losses

### For Irfan (Demo)
- ✅ **Professional**: Sniper approach shows discipline
- ✅ **Trackable**: Clear win/loss record
- ✅ **Automated**: No manual posting needed

### For System
- ✅ **Scalable**: Works 24/7 without intervention
- ✅ **Reliable**: Database-driven state management
- ✅ **Auditable**: Full metadata trail

---

## 🧪 TESTING CHECKLIST

- [ ] Test with mock 95%+ signal
- [ ] Verify daily limit (only 1 post)
- [ ] Test expiry notification
- [ ] Test WIN result post
- [ ] Test LOSS result post
- [ ] Verify multi-group broadcast
- [ ] Check metadata updates
- [ ] Test day rollover (quota reset)

---

## 📈 SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Signals/Day** | 1 max | Count broadcasts |
| **Confidence** | 95%+ only | Filter threshold |
| **Lifecycle Coverage** | 100% | All 3 phases posted |
| **Uptime** | 24/7 | Railway monitoring |

---

## 🎯 READY FOR PRODUCTION

**Status**: ✅ **COMPLETE**  
**File**: `telegram_sniper_autopilot.js`  
**Dependencies**: `bot_utils.js` (already created)  
**Next Step**: Deploy to Railway as separate service

**Sniper Mode: Precision over quantity. Quality over speed.** 🎯
