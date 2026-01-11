import yahooFinance from 'yahoo-finance2';
import { RSI, BollingerBands, SMA } from 'technicalindicators';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

// --- CONFIGURATION ---
const ASSETS = ['VN30F1M', 'EURUSD=X', 'BTC-USD', 'AAPL']; // VN30, Forex, Crypto, Stock
const TIMEFRAME = '1h'; // Yahoo interval
const CHECK_INTERVAL = 60000; // 60 seconds

// --- TELEGRAM SETUP (Optional) ---
const bot = process.env.TELEGRAM_TOKEN ? new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false }) : null;

// --- DATABASE SETUP ---
const { Pool } = pg;
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: { rejectUnauthorized: false }
};
const pool = new Pool(dbConfig);

// --- HELPER FUNCTIONS ---

async function fetchMarketData(symbol) {
    try {
        // Fetch last 100 candles for indicators
        const queryOptions = { period1: '2023-01-01', interval: '1h', return: 'array' };
        // Note: In production logic, period1 should be dynamic (last 5 days)
        // Using quoteSummary for real-time price
        const quote = await yahooFinance.quote(symbol);

        // For indicators, we need historical
        // const historical = await yahooFinance.chart(symbol, queryOptions); 
        // (Simplified for skeleton: just returning current price)

        return {
            symbol,
            price: quote.regularMarketPrice,
            time: new Date()
        };
    } catch (error) {
        console.error(`❌ Error fetching ${symbol}:`, error.message);
        return null; // Failover logic would go here
    }
}

async function analyzeData(marketData) {
    if (!marketData) return null;

    // MOCK AI INFERENCE (Replace with Real Logic/Indicators later)
    // Feature Engineering would happen here (RSI, BB...)

    const randomSignal = Math.random();
    let signalType = 'WATCH';
    let confidence = 0;

    if (randomSignal > 0.8) {
        signalType = 'LONG';
        confidence = (randomSignal * 100).toFixed(2);
    } else if (randomSignal < 0.2) {
        signalType = 'SHORT';
        confidence = ((1 - randomSignal) * 100).toFixed(2);
    }

    if (signalType !== 'WATCH') {
        const atr = marketData.price * 0.005; // Mock ATR
        return {
            symbol: marketData.symbol,
            type: signalType,
            entry: marketData.price,
            sl: marketData.price - (signalType === 'LONG' ? 2 * atr : -2 * atr),
            tp: marketData.price + (signalType === 'LONG' ? 4 * atr : -4 * atr),
            confidence
        };
    }
    return null;
}

async function sendAlert(signal) {
    const msg = `
🚨 **AI SIGNAL ALERT** 🚨
Symbol: ${signal.symbol}
Type: ${signal.type} 🟢
Entry: ${signal.entry.toFixed(2)}
TP: ${signal.tp.toFixed(2)}
SL: ${signal.sl.toFixed(2)}
Confidence: ${signal.confidence}%
    `;
    console.log(msg);
    if (bot && process.env.TELEGRAM_CHAT_ID) {
        try {
            await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, msg, { parse_mode: 'Markdown' });
        } catch (e) {
            console.error("Telegram Error:", e.message);
        }
    }
}

async function saveSignalToDB(signal) {
    // Check if DB is configured
    if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD.includes('YOUR_')) {
        console.warn("⚠️ Database not configured, skipping save.");
        return;
    }

    const client = await pool.connect();
    try {
        const query = `
            INSERT INTO ai_signals (symbol, timestamp_utc, signal_type, predicted_close, confidence_score, is_published)
            VALUES ($1, NOW(), $2, $3, $4, TRUE)
        `;
        await client.query(query, [signal.symbol, signal.type, signal.tp, signal.confidence]);
        console.log(`✅ Signal saved to DB for ${signal.symbol}`);
    } catch (err) {
        console.error("❌ DB Save Error:", err.message);
    } finally {
        client.release();
    }
}

// --- MAIN LOOP ---
async function runScanner() {
    console.log("🚀 Starting AI Real-time Scanner...");
    console.log(`   Assets: ${ASSETS.join(', ')}`);
    console.log("-----------------------------------");

    setInterval(async () => {
        console.log(`\n⏰ Scanning at ${new Date().toLocaleTimeString()}...`);

        for (const symbol of ASSETS) {
            // Step 1: Ingestion
            const data = await fetchMarketData(symbol);

            // Step 2: Inference
            const signal = await analyzeData(data);

            // Step 3: Action
            if (signal) {
                await sendAlert(signal);
                await saveSignalToDB(signal);
            } else {
                // console.log(`   ${symbol}: No Signal (Watching...)`);
            }

            // Step 4: Monitoring (Check existing ACTIVE signals) - TODO
        }

    }, CHECK_INTERVAL);
}

// Start the engine
runScanner();
