# TELEGRAM AUTOPILOT ENGINE - V1.8

## 📋 OVERVIEW
The Telegram Autopilot Engine is an intelligent messaging orchestration system that provides:
- **Event-driven notifications** for real-time market events
- **Scheduled reports** to maintain community engagement
- **Smart filtering** to prevent spam while keeping users informed

## 🎯 MESSAGE TYPES

### 1. Event-Driven Messages (Real-time)

#### 🚨 Golden Signal
**Trigger**: Critic Agent approves signal with ≥85% confidence  
**Content**: Full Council analysis with Tech, Sentinel, and Critic verdicts  
**Function**: `broadcastGoldenSignal(signalData)`

#### 📢 Trade Updates
**Triggers**: 
- Entry Hit
- TP1 Hit (with SL adjustment reminder)
- SL Hit

**Function**: `broadcastTradeUpdate(updateType, signalData)`

### 2. Scheduled Messages (Time-based)

#### ☀️ Market Pulse
**Schedule**: Daily at 08:30 (Vietnam Time)  
**Purpose**: Morning market briefing and focus areas  
**Function**: `broadcastMarketPulse()`

#### 🛡️ Guardian Report
**Schedule**: Every 3 hours  
**Condition**: Only sent if signals were rejected  
**Purpose**: Demonstrate active risk management  
**Function**: `broadcastGuardianReport()`

#### 🌙 Daily Recap
**Schedule**: Daily at 23:00 (Vietnam Time)  
**Purpose**: Performance summary and P/L calculation  
**Function**: `broadcastDailyRecap()`

## 🛠️ TECHNICAL ARCHITECTURE

### Files Structure
```
backend/
├── telegram_autopilot.js    # Core messaging functions
├── telegram_scheduler.js     # Cron-based scheduling
├── bot.js                    # Base Telegram bot
└── server.js                 # Main process orchestration
```

### Dependencies
- `node-cron`: Scheduled task execution
- `node-telegram-bot-api`: Telegram integration
- `@supabase/supabase-js`: Database queries for reports

## 🚀 DEPLOYMENT

### Railway Environment
The scheduler runs as a child process alongside the bot and watchdog:
```javascript
const schedulerProcess = spawn('node', ['backend/telegram_scheduler.js'], { stdio: 'inherit' });
```

### Required Environment Variables
- `TELEGRAM_TOKEN`: Bot authentication
- `TELEGRAM_CHAT_ID`: Target channel/group
- `SUPABASE_URL` & `SUPABASE_SERVICE_KEY`: Database access

## 📊 USAGE EXAMPLES

### Sending a Golden Signal
```javascript
import { broadcastGoldenSignal } from './telegram_autopilot.js';

const signalData = {
    pair: 'EUR/USD',
    action: 'LONG',
    entry: '1.16350',
    sl: '1.16100',
    tp: '1.16550',
    agentDecision: {
        confidence: 92,
        agentConsensus: {
            technical: { reasoning: 'Bullish divergence on M15' },
            sentinel: { reasoning: 'No high-impact news detected' }
        }
    }
};

await broadcastGoldenSignal(signalData);
```

### Manual Guardian Report
```javascript
import { broadcastGuardianReport } from './telegram_autopilot.js';

await broadcastGuardianReport();
```

## 🎯 INTEGRATION WITH ORCHESTRATOR

The Orchestrator should call autopilot functions when:
1. **Golden Signal**: After Critic approves with ≥85% confidence
2. **Trade Updates**: When signal status changes (ENTRY_HIT, TP1_HIT, SL_HIT)

Example integration in `orchestrator.js`:
```javascript
import { broadcastGoldenSignal } from './telegram_autopilot.js';

if (finalDecision.passedShadowMode && finalDecision.confidence >= 85) {
    await broadcastGoldenSignal({
        pair: marketData.symbol,
        action: marketData.direction,
        entry: marketData.entryPrice,
        sl: marketData.stopLoss,
        tp: marketData.takeProfit,
        agentDecision: finalDecision
    });
}
```

## 📈 MONITORING

Check scheduler logs on Railway:
```
[SCHEDULER] ✅ All scheduled tasks registered:
  - Market Pulse: 08:30 daily
  - Guardian Report: Every 3 hours
  - Daily Recap: 23:00 daily
```

## 🔄 FUTURE ENHANCEMENTS
- [ ] Adaptive scheduling based on market volatility
- [ ] Multi-language support
- [ ] Personalized notifications per user
- [ ] Interactive buttons for trade management
- [ ] Voice message summaries for premium users

---

**Status**: ✅ Production Ready  
**Version**: 1.8.0  
**Last Updated**: 2026-01-12
