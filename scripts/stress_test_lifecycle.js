/**
 * QUANTIX STRESS TEST - SIGNAL LIFECYCLE EXPIRATION
 * Tạo 10 signals giả lập với các mốc thời gian khác nhau
 * để test logic TTL (3 hours)
 */

import dotenv from 'dotenv';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

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

/**
 * Create test signals with different ages
 */
async function createTestSignals() {
    const client = await pool.connect();

    try {
        console.log('\n🧪 QUANTIX STRESS TEST - SIGNAL LIFECYCLE');
        console.log('='.repeat(60));
        console.log('Creating 10 test signals with varying ages...\n');

        const testCases = [
            { age: 2.0, status: 'WAITING', description: '2h old - Should NOT expire' },
            { age: 2.5, status: 'WAITING', description: '2.5h old - Should NOT expire' },
            { age: 2.9, status: 'ENTRY_HIT', description: '2.9h old - Should NOT expire' },
            { age: 3.0, status: 'WAITING', description: '3.0h old - Should EXPIRE' },
            { age: 3.1, status: 'WAITING', description: '3.1h old - Should EXPIRE' },
            { age: 3.5, status: 'ENTRY_HIT', description: '3.5h old - Should EXPIRE' },
            { age: 4.0, status: 'WAITING', description: '4h old - Should EXPIRE' },
            { age: 2.8, status: 'TP1_HIT', description: '2.8h old, TP1 hit - Should NOT expire (target reached)' },
            { age: 5.0, status: 'SL_HIT', description: '5h old, SL hit - Should NOT expire (already closed)' },
            { age: 3.2, status: 'TP2_HIT', description: '3.2h old, TP2 hit - Should NOT expire (target reached)' }
        ];

        const insertedSignals = [];

        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            const createdAt = new Date(Date.now() - testCase.age * 60 * 60 * 1000);

            const result = await client.query(`
                INSERT INTO ai_signals (
                    id, symbol, signal_type, predicted_close, confidence_score,
                    is_published, signal_status, created_at, last_checked_at, timestamp_utc
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $8)
                RETURNING id, created_at
            `, [
                uuidv4(),
                'EURUSD=X',
                i % 2 === 0 ? 'LONG' : 'SHORT',
                1.03500 + (i * 0.0001),
                85 + (i % 10),
                true,
                testCase.status,
                createdAt
            ]);

            insertedSignals.push({
                id: result.rows[0].id,
                age: testCase.age,
                status: testCase.status,
                description: testCase.description,
                createdAt: result.rows[0].created_at
            });

            console.log(`✅ Signal ${i + 1}/10: ${testCase.description}`);
            console.log(`   ID: ${result.rows[0].id.substring(0, 8)}...`);
            console.log(`   Created: ${createdAt.toLocaleString()}`);
            console.log(`   Status: ${testCase.status}\n`);
        }

        console.log('='.repeat(60));
        console.log('✅ Test signals created successfully!');
        console.log(`📊 Total: ${insertedSignals.length} signals`);
        console.log('\n📋 EXPECTED RESULTS:');
        console.log('   - Signals < 3h old: Should NOT expire');
        console.log('   - Signals >= 3h old with WAITING/ENTRY_HIT: Should EXPIRE');
        console.log('   - Signals with TP1_HIT/TP2_HIT/SL_HIT: Should NOT expire (already closed)');
        console.log('\n⏱️  Run lifecycle manager to verify expiration logic.');
        console.log('='.repeat(60));

        return insertedSignals;

    } catch (error) {
        console.error('❌ Error creating test signals:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Cleanup test signals
 */
async function cleanupTestSignals() {
    const client = await pool.connect();

    try {
        console.log('\n🧹 Cleaning up test signals...');

        const result = await client.query(`
            DELETE FROM ai_signals
            WHERE symbol = 'EURUSD=X'
            AND confidence_score BETWEEN 85 AND 94
            AND created_at > NOW() - INTERVAL '6 hours'
            RETURNING id
        `);

        console.log(`✅ Deleted ${result.rowCount} test signals`);

    } catch (error) {
        console.error('❌ Cleanup error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

// Main execution
async function runStressTest() {
    try {
        await createTestSignals();

        console.log('\n💡 NEXT STEPS:');
        console.log('1. Run: node backend/signal_lifecycle_manager.js');
        console.log('2. Verify expiration messages in console');
        console.log('3. Check Telegram for expiration alerts');
        console.log('\n🧹 To cleanup: node scripts/stress_test_lifecycle.js --cleanup\n');

    } catch (error) {
        console.error('❌ Stress test failed:', error.message);
        process.exit(1);
    }
}

// Check for cleanup flag
if (process.argv.includes('--cleanup')) {
    cleanupTestSignals();
} else {
    runStressTest();
}
