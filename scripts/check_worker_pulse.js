import dotenv from 'dotenv';
import pg from 'pg';

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

async function checkWorkerPulse() {
    console.log("🕵️ Checking if Railway Worker is alive...");
    const client = await pool.connect();

    try {
        // Query signal mới nhất của EURUSD
        const res = await client.query(`
            SELECT id, current_price, last_checked_at 
            FROM ai_signals 
            WHERE symbol = 'EURUSD=X' 
            ORDER BY created_at DESC 
            LIMIT 1
        `);

        if (res.rows.length === 0) {
            console.log("⚠️ No signals found in DB.");
            return;
        }

        const signal = res.rows[0];
        const lastUpdate = new Date(signal.last_checked_at);
        const now = new Date();
        const diffSeconds = (now - lastUpdate) / 1000;

        console.log(`\n📊 LATEST SIGNAL DATA:`);
        console.log(`   ID: ${signal.id}`);
        console.log(`   Price: ${signal.current_price}`);
        console.log(`   Last Update: ${lastUpdate.toLocaleString()}`);
        console.log(`   Time online: ${now.toLocaleString()}`);
        console.log(`   Lag: ${diffSeconds.toFixed(1)} seconds`);

        if (diffSeconds < 60) {
            console.log("\n✅ WORKER IS ACTIVE & HEALTHY! (Updated < 1 min ago)");
            console.log("   Dashboard should be updating correctly.");
        } else {
            console.log("\n⚠️ WORKER MIGHT BE STUCK! (Last update was > 1 min ago)");
            console.log("   👉 ACTION REQUIRED: Go to Railway Dashboard -> Restart 'worker' service.");
        }

    } catch (err) {
        console.error("❌ DB Check Error:", err.message);
    } finally {
        client.release();
        pool.end();
    }
}

checkWorkerPulse();
