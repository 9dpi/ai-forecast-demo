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

async function addGoldSymbols() {
    const client = await pool.connect();
    try {
        await client.query(`
            INSERT INTO assets_master (symbol, name, asset_type, exchange, timezone, currency) 
            VALUES 
                ('GC=F', 'Gold Futures', 'COMMODITY', 'COMEX', 'UTC', 'USD'),
                ('XAUUSD=X', 'Gold Spot USD', 'FOREX', 'GLOBAL', 'UTC', 'USD')
            ON CONFLICT (symbol) DO NOTHING
        `);
        console.log('✅ Added Gold symbols to assets_master');
    } finally {
        client.release();
        process.exit(0);
    }
}

addGoldSymbols();
