import pg from 'pg';
import dotenv from 'dotenv';
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

async function removeDemoSignals() {
    console.log("🧹 Removing all injected demo signals for absolute data integrity...");
    const client = await pool.connect();

    try {
        // Remove high-confidence manual signals injected for the demo
        const query = `
            DELETE FROM ai_signals 
            WHERE confidence_score = 94 
            AND symbol = 'EURUSD=X'
        `;

        const res = await client.query(query);
        console.log(`✅ SUCCESS: Removed ${res.rowCount} demo signals.`);

    } catch (err) {
        console.error("❌ Cleanup Error:", err.message);
    } finally {
        client.release();
        process.exit();
    }
}

removeDemoSignals();
