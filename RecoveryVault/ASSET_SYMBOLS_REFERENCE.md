# QUANTIX AI - MONITORED ASSETS REFERENCE
# Created: 2026-01-13T12:02:00+07:00
# Purpose: Exact symbols for Scanner to populate market_snapshot table

## PRIMARY ASSETS (4 symbols)

### 1. EUR/USD Forex Pair
- **Symbol**: `EURUSD=X`
- **Type**: Forex
- **Exchange**: Yahoo Finance Forex
- **Typical Range**: 1.05 - 1.15
- **Update Frequency**: Every 60 seconds
- **Priority**: HIGH (Primary demo asset)

### 2. Bitcoin
- **Symbol**: `BTC-USD`
- **Type**: Cryptocurrency
- **Exchange**: Coinbase (via Yahoo Finance)
- **Typical Range**: $40,000 - $100,000
- **Update Frequency**: Every 60 seconds
- **Priority**: HIGH (Crypto exposure)

### 3. Apple Inc.
- **Symbol**: `AAPL`
- **Type**: US Stock
- **Exchange**: NASDAQ
- **Typical Range**: $150 - $250
- **Update Frequency**: Every 60 seconds (market hours only)
- **Priority**: MEDIUM (Traditional equity)

### 4. Vietnam VN30 Futures
- **Symbol**: `VN30F1M`
- **Type**: Index Futures
- **Exchange**: Vietnam
- **Typical Range**: 1,000 - 1,500
- **Update Frequency**: Every 60 seconds (market hours only)
- **Priority**: LOW (Regional exposure)
- **Note**: May have limited data availability

---

## SCANNER CONFIGURATION

The Scanner will populate `market_snapshot` table with these exact symbols:

```javascript
const MONITORED_ASSETS = [
    'EURUSD=X',  // Forex - Primary
    'BTC-USD',   // Crypto
    'AAPL',      // US Stock
    'VN30F1M'    // Vietnam Futures
];
```

---

## DATA STRUCTURE IN market_snapshot

Each symbol will have:
- `current_price`: Latest price
- `open_price`: Day's opening price
- `high_price`: Day's high
- `low_price`: Day's low
- `volume`: Trading volume
- `last_4_candles`: Array of last 4 hourly candles `[{o, h, l, c, v}, ...]`
- `rsi_14`: 14-period RSI
- `ma_20`: 20-period moving average
- `ma_50`: 50-period moving average
- `data_quality`: 'GOOD', 'STALE', or 'DEGRADED'
- `last_updated`: Timestamp

---

## VERIFICATION QUERIES

After SSOT migration, verify data with:

```sql
-- Check all symbols are present
SELECT symbol, current_price, data_quality, last_updated 
FROM market_snapshot 
ORDER BY symbol;

-- Check data freshness (should be < 2 minutes old)
SELECT symbol, 
       current_price, 
       EXTRACT(EPOCH FROM (NOW() - last_updated)) as seconds_old
FROM market_snapshot
WHERE EXTRACT(EPOCH FROM (NOW() - last_updated)) > 120;

-- Check last_4_candles structure
SELECT symbol, 
       jsonb_array_length(last_4_candles) as candle_count,
       last_4_candles
FROM market_snapshot
WHERE symbol = 'EURUSD=X';
```

---

**Last Updated**: 2026-01-13T12:02:00+07:00  
**Status**: ✅ READY FOR SSOT IMPLEMENTATION
