/**
 * QUANTIX CORE v1.9 - SEED PATTERNS
 * Thực hiện kiểm tra tính toàn vẹn dữ liệu và tạo mẫu hình cho v1.9
 */

import dotenv from 'dotenv';
import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: { rejectUnauthorized: false }
});

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Kiểm tra logic nến
 */
function isLogical(candle) {
    return (
        parseFloat(candle.high) >= parseFloat(candle.low) &&
        parseFloat(candle.high) >= parseFloat(candle.open) &&
        parseFloat(candle.high) >= parseFloat(candle.close) &&
        parseFloat(candle.open) > 0 &&
        parseFloat(candle.close) > 0
    );
}

/**
 * Kiểm tra cuối tuần (Thứ 7, Chủ Nhật)
 */
function isWeekend(dateStr) {
    const date = new Date(dateStr);
    const day = date.getUTCDay();
    return day === 6 || day === 0; // 6: Sat, 0: Sun
}

/**
 * Tạo mã hash cho window 4 nến
 */
function generateHash(window) {
    const dataString = window.map(c => `${c.open},${c.high},${c.low},${c.close}`).join('|');
    return crypto.createHash('md5').update(dataString).digest('hex');
}

async function cleanAndSeed() {
    console.log(`\n🔍 Starting Data Integrity Check... [Mode: ${DRY_RUN ? 'DRY RUN' : 'UPSERT'}]`);
    console.log('='.repeat(60));

    const client = await pool.connect();

    try {
        if (!DRY_RUN) {
            console.log(`🚀 Ensuring table pattern_cache exists...`);
            await client.query(`
                CREATE TABLE IF NOT EXISTS pattern_cache (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    vector_hash TEXT UNIQUE,
                    results JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `);
        }

        // 1. Fetch market data
        const { rows: candles } = await client.query(`
            SELECT id, symbol, open, high, low, close, volume, timestamp_utc, created_at
            FROM market_data
            ORDER BY timestamp_utc ASC
        `);

        if (candles.length === 0) {
            console.log("❌ No market data found.");
            return;
        }

        console.log(`📊 Total candles fetched: ${candles.length}`);

        // 2. Data Integrity Analysis
        let dirtyCount = 0;
        let gapCount = 0;
        const cleanCandles = [];

        for (let i = 0; i < candles.length; i++) {
            const c = candles[i];

            // Check logic
            if (!isLogical(c)) {
                dirtyCount++;
                continue;
            }

            // Check Gap (M15 = 15 minutes = 900,000ms)
            if (i > 0) {
                const diff = new Date(c.timestamp_utc) - new Date(candles[i - 1].timestamp_utc);
                if (diff > 15 * 60 * 1000 && !isWeekend(c.timestamp_utc)) {
                    gapCount++;
                    // Optional: log specific gaps if needed
                    // console.warn(`⚠️ Gap detected: ${candles[i-1].timestamp_utc} to ${c.timestamp_utc}`);
                }
            }

            cleanCandles.push(c);
        }

        const purity = ((cleanCandles.length / candles.length) * 100).toFixed(2);
        console.log(`\n📊 INTEGRITY REPORT:`);
        console.log(`├─ Clean Candles: ${cleanCandles.length}`);
        console.log(`├─ Dirty Candles: ${dirtyCount}`);
        console.log(`├─ Gaps Detected: ${gapCount}`);
        console.log(`└─ Data Purity: ${purity}%`);

        if (parseFloat(purity) < 98) {
            console.log(`\n❌ CRITICAL: Data purity below 98%. Seeding aborted.`);
            return;
        }

        // 3. Pattern Generation (v1.9 Structure)
        console.log(`\n🚀 Generating 4-candle patterns...`);
        const patterns = [];
        for (let i = 4; i < cleanCandles.length; i++) {
            const window = cleanCandles.slice(i - 4, i);
            const nextCandle = cleanCandles[i];

            patterns.push({
                vector_hash: generateHash(window),
                results: {
                    candles: window.map(c => ({
                        o: parseFloat(c.open),
                        h: parseFloat(c.high),
                        l: parseFloat(c.low),
                        c: parseFloat(c.close),
                        t: c.timestamp_utc
                    })),
                    next_move: parseFloat(nextCandle.close) > parseFloat(window[window.length - 1].close) ? 'UP' : 'DOWN',
                    symbol: window[0].symbol,
                    metadata: { source: 'local_audit_v1' }
                }
            });
        }

        console.log(`✅ Generated ${patterns.length} patterns.`);

        // 3.5 Deduplicate patterns by vector_hash
        const uniquePatternsMap = new Map();
        patterns.forEach(p => {
            if (!uniquePatternsMap.has(p.vector_hash)) {
                uniquePatternsMap.set(p.vector_hash, p);
            }
        });
        const uniquePatterns = Array.from(uniquePatternsMap.values());
        console.log(`💎 Unique patterns: ${uniquePatterns.length} (Deduplicated ${patterns.length - uniquePatterns.length} duplicates)`);

        // 3.6 EXPORT BACKUP TO LOCAL (RecoveryVault/)
        console.log(`\n💾 Exporting local backup to RecoveryVault/patterns_backup_v1.9.json...`);
        const backupPath = path.join('d:', 'Automator_Prj', 'AI_Smart_Forecast_Comercial', 'RecoveryVault', 'patterns_backup_v1.9.json');

        try {
            // Ensure directory exists (usually it does in this project)
            const dir = path.dirname(backupPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(backupPath, JSON.stringify(uniquePatterns, null, 2));
            console.log(`✅ Backup SAVED successfully: ${uniquePatterns.length} patterns.`);
        } catch (err) {
            console.error(`❌ Failed to save backup:`, err.message);
        }

        if (DRY_RUN) {
            console.log(`\n🏁 DRY RUN COMPLETE. No data written to database.`);
            return;
        }

        // 4. Seeding to pattern_cache
        console.log(`\n🚀 UPSERTING to pattern_cache (Batch mode)...`);

        const BATCH_SIZE = 500;
        let upsertedCount = 0;

        for (let i = 0; i < uniquePatterns.length; i += BATCH_SIZE) {
            const batch = uniquePatterns.slice(i, i + BATCH_SIZE);

            // Build a single bulk insert query
            const values = [];
            const placeholders = [];

            batch.forEach((p, idx) => {
                const base = idx * 2;
                placeholders.push(`($${base + 1}, $${base + 2})`);
                values.push(p.vector_hash, JSON.stringify(p.results));
            });

            const query = `
                INSERT INTO pattern_cache (vector_hash, results)
                VALUES ${placeholders.join(', ')}
                ON CONFLICT (vector_hash) DO UPDATE 
                SET results = EXCLUDED.results
            `;

            await client.query(query, values);
            upsertedCount += batch.length;
            process.stdout.write(`\rProgress: ${upsertedCount}/${uniquePatterns.length} patterns...`);
        }

        console.log(`\n\n🎉 SEEDING COMPLETE!`);
        console.log(`✅ Total patterns upserted: ${upsertedCount}`);

    } catch (error) {
        console.error("❌ Seeding Error:", error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

cleanAndSeed();
