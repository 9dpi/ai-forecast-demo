# Quantix AI Core - Distributed System Architecture

## 🏗️ System Overview

This document outlines the architecture for separating **Quantix AI Core** (The Brain) from the **MVP Frontend** (The Face), transforming the system into a distributed microservices architecture.

## 📋 Signal Schema (The Contract)

Both systems communicate using a standardized JSON schema located in `/shared/signal-schema.json` and `/shared/signal-schema.ts`.

### Example Signal:
```json
{
  "signal_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-01-11T17:05:00Z",
  "pair": "EUR/USD",
  "timeframe": "M15",
  "type": "BUY",
  "entry_price": 1.16540,
  "sl": 1.16190,
  "tp": 1.17240,
  "confidence_score": 92,
  "sentiment": "STRONG BULLISH",
  "status": "ACTIVE",
  "version": "AI AGENT V1.5",
  "expiry_time": "2026-01-11T21:05:00Z",
  "metadata": {
    "backtest_ref": "5_year_matching_v1",
    "volatility": "low",
    "tp1_price": 1.17000,
    "tp2_price": 1.17480
  }
}
```

## 🔄 Workflow: From A to Z

### Phase 1: Isolate Quantix AI Core (The Brain)

#### 1.1 Create Separate Repository
```bash
# Create new project for Core
mkdir quantix-ai-core
cd quantix-ai-core
npm init -y
```

#### 1.2 Install Dependencies
```bash
npm install dotenv node-fetch pg uuid
npm install --save-dev @types/node typescript
```

#### 1.3 Core Structure
```
quantix-ai-core/
├── src/
│   ├── engine/
│   │   ├── scanner.js          # Market data scanner
│   │   ├── analyzer.js         # 5-year backtest logic
│   │   └── watchdog.js         # Price monitoring
│   ├── dispatcher/
│   │   └── signal-sender.js    # Send signals to MVP
│   ├── config/
│   │   └── env.js              # Environment variables
│   └── index.js                # Main entry point
├── shared/
│   ├── signal-schema.json      # Copied from MVP
│   └── signal-schema.ts        # Copied from MVP
├── .env
└── package.json
```

#### 1.4 Environment Variables (.env)
```env
# MVP Connection
MVP_API_URL=https://your-mvp-domain.com/api/v1/internal/signals
INTERNAL_AUTH_KEY=your-super-secret-key-here

# Database (if Core needs direct access)
DB_HOST=aws-1-ap-south-1.pooler.supabase.com
DB_NAME=postgres
DB_USER=postgres.gvglzvjsexeaectypkyk
DB_PASSWORD=EpVgJ9G%-EQA.Qm
DB_PORT=6543

# Telegram
TELEGRAM_TOKEN=8528989748:AAEwGwcVzzbNOSLj-P_V80ReaIreSvKzWuY
TELEGRAM_CHAT_ID=7985984228

# Data Sources
ALPHA_VANTAGE_KEY=Z9JGV0STF4PE6C61
```

### Phase 2: Prepare MVP to Receive Signals (The Face)

#### 2.1 Create API Endpoint
Create file: `backend/api/receive-signal.js`

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const INTERNAL_AUTH_KEY = process.env.INTERNAL_AUTH_KEY;

export default async function handler(req, res) {
  // Security: Check authentication
  const authHeader = req.headers['x-auth-token'];
  if (authHeader !== INTERNAL_AUTH_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signal = req.body;

    // Validate signal structure
    if (!signal.signal_id || !signal.pair || !signal.type) {
      return res.status(400).json({ error: 'Invalid signal format' });
    }

    // Upsert to database
    const { data, error } = await supabase
      .from('ai_signals')
      .upsert({
        id: signal.signal_id,
        symbol: signal.pair.replace('/', '') + '=X',
        timestamp_utc: signal.timestamp,
        predicted_close: signal.entry_price,
        confidence_score: signal.confidence_score,
        signal_type: signal.type === 'BUY' ? 'LONG' : 'SHORT',
        signal_status: signal.status,
        sl_price: signal.sl,
        tp1_price: signal.metadata?.tp1_price,
        tp2_price: signal.metadata?.tp2_price,
        model_version: signal.version,
        is_published: true
      }, { onConflict: 'id' });

    if (error) throw error;

    // Send Telegram notification (optional)
    // await sendTelegramAlert(signal);

    return res.status(200).json({ 
      success: true, 
      message: 'Signal received and processed' 
    });

  } catch (error) {
    console.error('Signal processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### 2.2 Add Route to Express/Vite
If using Vite with Express middleware, add:
```javascript
app.post('/api/v1/internal/signals', receiveSignalHandler);
```

### Phase 3: Connect and Test (The Bridge)

#### 3.1 Local Testing
1. Start MVP server: `npm run dev` (port 5173)
2. Start Core server: `node src/index.js`
3. Set Core's `MVP_API_URL=http://localhost:5173/api/v1/internal/signals`

#### 3.2 Test Signal Dispatch
Create `test-signal.js` in Core:
```javascript
import fetch from 'node-fetch';

const testSignal = {
  signal_id: "test-" + Date.now(),
  timestamp: new Date().toISOString(),
  pair: "EUR/USD",
  timeframe: "M15",
  type: "BUY",
  entry_price: 1.16540,
  sl: 1.16190,
  tp: 1.17240,
  confidence_score: 92,
  sentiment: "STRONG BULLISH",
  status: "ACTIVE",
  version: "AI AGENT V1.5"
};

fetch('http://localhost:5173/api/v1/internal/signals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-auth-token': 'your-secret-key'
  },
  body: JSON.stringify(testSignal)
})
.then(res => res.json())
.then(data => console.log('✅ Signal sent:', data))
.catch(err => console.error('❌ Error:', err));
```

### Phase 4: Production Deployment

#### 4.1 Deploy Core
**Option A: Render.com**
- Create new Web Service
- Connect to Core repository
- Set environment variables
- Deploy

**Option B: Railway.app**
- Similar process, easier setup

**Option C: VPS (DigitalOcean/AWS)**
- Use PM2 for process management
- Set up Nginx reverse proxy

#### 4.2 Update MVP Configuration
```env
# Production MVP .env
INTERNAL_AUTH_KEY=generate-strong-random-key-here
SUPABASE_SERVICE_KEY=your-service-role-key
```

#### 4.3 Enable Watchdog 24/7
In Core's main loop:
```javascript
setInterval(async () => {
  await scanMarket();
  await analyzeSignals();
  await dispatchNewSignals();
}, 10000); // Every 10 seconds
```

## 🛡️ Expired Signal Logic

### Option A: Active (Recommended)
Core monitors signals and sends status updates:
```javascript
// In Core's watchdog
if (signalExpired(signal)) {
  await dispatchStatusUpdate({
    signal_id: signal.id,
    status: 'EXPIRED',
    timestamp: new Date().toISOString()
  });
}
```

### Option B: Passive
Frontend checks expiry client-side:
```javascript
// In MVP
const isExpired = new Date() > new Date(signal.expiry_time);
```

## 📊 Benefits of This Architecture

1. **Scalability**: Core can serve multiple frontends
2. **Maintainability**: Separate concerns, easier debugging
3. **Security**: Core logic hidden from public
4. **Flexibility**: Can swap Core or MVP independently
5. **Performance**: Each system optimized for its role

## 🔐 Security Checklist

- [ ] Use strong `INTERNAL_AUTH_KEY` (min 32 characters)
- [ ] Enable HTTPS for all API calls
- [ ] Rate limit the `/api/v1/internal/signals` endpoint
- [ ] Log all incoming signals for audit
- [ ] Use Supabase Row Level Security (RLS)
- [ ] Rotate keys monthly

## 📝 Next Steps

1. ✅ Create Signal Schema (Done)
2. ⏳ Build Core dispatcher module
3. ⏳ Implement MVP receiver endpoint
4. ⏳ Local integration testing
5. ⏳ Deploy to production
6. ⏳ Monitor and optimize

---

**Version**: 1.0  
**Last Updated**: 2026-01-11  
**Maintained By**: Signal Genius AI Team
