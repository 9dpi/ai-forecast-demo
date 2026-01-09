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

async function cleanDatabase() {
    console.log("🧹 CLEANING TEST DATA FROM DATABASE...\n");

    const client = await pool.connect();

    try {
        // Step 1: Check old data
        const checkResult = await client.query(`
            SELECT COUNT(*) as old_signals, 
                   MAX(created_at) as latest_date,
                   MIN(predicted_close) as min_price,
                   MAX(predicted_close) as max_price
            FROM ai_signals 
            WHERE symbol = 'EURUSD=X' 
            AND predicted_close < 1.10
        `);

        console.log("📊 OLD DATA FOUND:");
        console.log(checkResult.rows[0]);

        // Step 2: Delete old test data
        const deleteResult = await client.query(`
            DELETE FROM ai_signals 
            WHERE symbol = 'EURUSD=X' 
            AND (
                predicted_close < 1.10 
                OR signal_status = 'WAITING'
                OR created_at < NOW() - INTERVAL '7 days'
            )
            RETURNING id, predicted_close, created_at
        `);

        console.log(`\n✅ DELETED ${deleteResult.rowCount} old signals`);
        if (deleteResult.rows.length > 0) {
            console.log("Sample deleted:");
            console.log(deleteResult.rows.slice(0, 3));
        }

        // Step 3: Verify clean state
        const verifyResult = await client.query(`
            SELECT COUNT(*) as remaining_signals
            FROM ai_signals 
            WHERE symbol = 'EURUSD=X'
        `);

        console.log(`\n✅ DATABASE CLEAN - Remaining signals: ${verifyResult.rows[0].remaining_signals}`);

    } catch (error) {
        console.error("❌ Error:", error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run
cleanDatabase()
    .then(() => {
        console.log("\n✅ Database cleanup complete!");
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ Fatal error:", err);
        process.exit(1);
    });
