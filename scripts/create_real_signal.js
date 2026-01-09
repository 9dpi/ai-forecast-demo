import dotenv from 'dotenv';
import pg from 'pg';
import fetch from 'node-fetch';

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

const ALPHA_VANTAGE_KEY = 'Z9JGV0STF4PE6C61';

async function getCurrentPrice() {
    try {
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=EUR&to_currency=USD&apikey=${ALPHA_VANTAGE_KEY}`;
        const response = await fetch(url, { timeout: 5000 });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.Note || data['Error Message']) {
            console.warn("⚠️ Alpha Vantage rate limit, using Yahoo fallback");
            return await getYahooPrice();
        }

        const price = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
        console.log(`📊 Alpha Vantage EUR/USD: ${price}`);
        return price;

    } catch (error) {
        console.error("❌ Alpha Vantage Error:", error.message);
        return await getYahooPrice();
    }
}

async function getYahooPrice() {
    try {
        const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/EURUSD=X?interval=1m&range=1d', { timeout: 5000 });
        const data = await response.json();
        const price = data.chart.result[0].meta.regularMarketPrice;
        console.log(`📊 Yahoo EUR/USD: ${price}`);
        return price;
    } catch (error) {
        console.error("❌ Yahoo Error:", error.message);
        return null;
    }
}

async function createRealSignal() {
    console.log("🚀 CREATING PRODUCTION SIGNAL WITH REAL-TIME PRICE...\n");

    const currentPrice = await getCurrentPrice();

    if (!currentPrice) {
        console.error("❌ Cannot fetch current price. Aborting.");
        process.exit(1);
    }

    console.log(`\n💰 Current EUR/USD Price: ${currentPrice}`);

    // Calculate signal levels based on REAL current price
    const entry = currentPrice;
    const sl = (entry * 0.997).toFixed(4);      // -0.3% Stop Loss
    const tp1 = (entry * 1.004).toFixed(4);     // +0.4% TP1
    const tp2 = (entry * 1.008).toFixed(4);     // +0.8% TP2

    console.log(`\n📊 Signal Levels:`);
    console.log(`   Entry: ${entry}`);
    console.log(`   SL:    ${sl}`);
    console.log(`   TP1:   ${tp1}`);
    console.log(`   TP2:   ${tp2}`);

    const client = await pool.connect();

    try {
        // Insert asset if not exists
        await client.query(`
            INSERT INTO assets_master (symbol, name, asset_type, exchange, timezone, currency)
            VALUES ('EURUSD=X', 'EUR/USD Forex Pair', 'FOREX', 'GLOBAL', 'UTC', 'USD')
            ON CONFLICT (symbol) DO NOTHING
        `);

        // Create PRODUCTION signal
        const result = await client.query(`
            INSERT INTO ai_signals (
                symbol, 
                timestamp_utc,
                signal_type, 
                predicted_close, 
                confidence_score, 
                is_published,
                signal_status,
                entry_price,
                sl_price,
                tp1_price,
                tp2_price,
                current_price
            ) VALUES (
                'EURUSD=X',
                NOW(),
                'LONG',
                $1,
                92,
                TRUE,
                'WAITING',
                $1,
                $2,
                $3,
                $4,
                $1
            ) RETURNING id, created_at
        `, [entry, sl, tp1, tp2]);

        console.log(`\n✅ PRODUCTION SIGNAL CREATED:`);
        console.log(`   ID: ${result.rows[0].id}`);
        console.log(`   Created: ${result.rows[0].created_at}`);
        console.log(`\n🔥 Watchdog will now track this signal in real-time!`);

    } catch (error) {
        console.error("❌ Database Error:", error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run
createRealSignal()
    .then(() => {
        console.log("\n✅ Production signal creation complete!");
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ Fatal error:", err);
        process.exit(1);
    });
