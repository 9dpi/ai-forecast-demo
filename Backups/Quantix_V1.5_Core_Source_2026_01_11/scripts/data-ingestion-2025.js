/**
 * 📥 HISTORICAL DATA INGESTION PIPELINE (MODIFIED FOR FREE SOURCES)
 * Purpose: Nạp dữ liệu sạch 1 năm (2025) vào Supabase
 * 
 * Features:
 * - Multi-source support (Yahoo Finance, Alpha Vantage - Premium, CSV)
 * - Data validation & cleaning
 * - Batch upload with progress tracking
 */

import dotenv from 'dotenv';
import pg from 'pg';
import fetch from 'node-fetch';
import fs from 'fs';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '6543'),
    ssl: { rejectUnauthorized: false }
});

const CONFIG = {
    SYMBOL: 'EURUSD=X',
    YEAR: 2025,
    TIMEFRAME: '60m',
    DATA_SOURCE: 'YAHOO', // Chuyển sang YAHOO vì Alpha Vantage FX_INTRADAY là Premium
    MAX_ALLOWED_PIPS: 500,
    BATCH_SIZE: 1000
};

const stats = {
    totalFetched: 0,
    totalCleaned: 0,
    totalInserted: 0,
    totalSkipped: 0,
    errors: []
};

async function fetchYahooData(symbol) {
    console.log(`\n🔍 Fetching data from Yahoo Finance...`);
    // 2025-01-01 to 2025-12-31
    const p1 = 1735689600;
    const p2 = 1767225600;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${p1}&period2=${p2}&interval=1h`;

    try {
        const response = await fetch(url, { timeout: 15000 });
        if (!response.ok) throw new Error(`Yahoo HTTP Error: ${response.status}`);

        const data = await response.json();
        const result = data.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];

        const candles = timestamps.map((ts, i) => ({
            timestamp: new Date(ts * 1000),
            open: quotes.open[i],
            high: quotes.high[i],
            low: quotes.low[i],
            close: quotes.close[i],
            volume: quotes.volume[i] || 0
        })).filter(c => c.open && c.close);

        stats.totalFetched = candles.length;
        console.log(`✅ Fetched ${candles.length} candles from Yahoo Finance`);
        return candles;
    } catch (error) {
        console.error(`❌ Yahoo Fetch Error: ${error.message}`);
        stats.errors.push({ step: 'fetch', error: error.message });
        return [];
    }
}

function cleanData(rawCandles) {
    console.log(`\n🧹 Cleaning data...`);
    const cleaned = rawCandles.filter(candle => {
        if (!candle.close || !candle.open) { stats.totalSkipped++; return false; }
        const pipRange = Math.abs(candle.high - candle.low) * 10000;
        if (pipRange > CONFIG.MAX_ALLOWED_PIPS) { stats.totalSkipped++; return false; }
        return true;
    });
    stats.totalCleaned = cleaned.length;
    console.log(`✅ Cleaned: ${cleaned.length} valid candles`);
    return cleaned;
}

async function uploadToDatabase(candles) {
    console.log(`\n📤 Uploading to Supabase...`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let uploaded = 0;
        for (let i = 0; i < candles.length; i += CONFIG.BATCH_SIZE) {
            const batch = candles.slice(i, i + CONFIG.BATCH_SIZE);
            const values = batch.map((c, idx) => `($${idx * 7 + 1}, $${idx * 7 + 2}, $${idx * 7 + 3}, $${idx * 7 + 4}, $${idx * 7 + 5}, $${idx * 7 + 6}, $${idx * 7 + 7})`).join(',');
            const params = batch.flatMap(c => [CONFIG.SYMBOL, c.timestamp.toISOString(), c.open, c.high, c.low, c.close, c.volume]);
            await client.query(`INSERT INTO market_data (symbol, timestamp_utc, open, high, low, close, volume) VALUES ${values} ON CONFLICT (symbol, timestamp_utc) DO NOTHING`, params);
            uploaded += batch.length;
            process.stdout.write(`\r   Progress: ${((uploaded / candles.length) * 100).toFixed(1)}% (${uploaded}/${candles.length})`);
        }
        await client.query('COMMIT');
        stats.totalInserted = uploaded;
        console.log(`\n\n✅ Upload complete!`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`\n❌ Upload Error: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        const raw = await fetchYahooData(CONFIG.SYMBOL);
        if (raw.length === 0) throw new Error('No data');
        const cleaned = cleanData(raw);
        await uploadToDatabase(cleaned);
        console.log(`\n📊 SUMMARY: Fetched: ${stats.totalFetched}, Cleaned: ${stats.totalCleaned}, Inserted: ${stats.totalInserted}`);
        process.exit(0);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}

main();
