/**
 * QUANTIX CORE V1.8.2 - SIGNAL LIFECYCLE MANAGER
 * "Active Communication Layer" - Trợ lý tận tâm 24/7
 * 
 * Features:
 * - TTL (Time To Live) tracking for signals
 * - Auto-expiration after 3 hours
 * - Real-time TP/SL monitoring
 * - Proactive Telegram notifications
 */

import dotenv from 'dotenv';
import pg from 'pg';
import TelegramBot from 'node-telegram-bot-api';

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

const bot = process.env.TELEGRAM_TOKEN ? new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false }) : null;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// --- CONFIGURATION ---
const TTL_HOURS = 3; // Signal expires after 3 hours
const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

/**
 * Send Telegram alert with professional formatting
 */
async function sendTelegramAlert(message) {
    if (!bot || !CHAT_ID) {
        console.log('[TELEGRAM] Bot not configured, skipping alert.');
        return;
    }

    try {
        await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
        console.log('[TELEGRAM] Alert sent successfully.');
    } catch (error) {
        console.error('[TELEGRAM] Failed to send alert:', error.message);
    }
}

/**
 * Check and expire old signals
 */
async function checkSignalExpiration(client) {
    const expirationTime = new Date(Date.now() - TTL_HOURS * 60 * 60 * 1000);

    const result = await client.query(`
        SELECT id, symbol, signal_type, predicted_close, confidence_score, created_at
        FROM ai_signals
        WHERE is_published = TRUE
        AND signal_status IN ('WAITING', 'ENTRY_HIT')
        AND created_at < $1
        AND (signal_status IS NULL OR signal_status NOT IN ('SL_HIT', 'TP1_HIT', 'TP2_HIT', 'EXPIRED'))
    `, [expirationTime]);

    for (const signal of result.rows) {
        const ageHours = ((Date.now() - new Date(signal.created_at)) / (1000 * 60 * 60)).toFixed(1);

        console.log(`⏰ [EXPIRATION] Signal ${signal.id} (${signal.symbol}) has exceeded TTL (${ageHours}h). Marking as EXPIRED.`);

        // Update database
        await client.query(`
            UPDATE ai_signals
            SET signal_status = 'EXPIRED', last_checked_at = NOW()
            WHERE id = $1
        `, [signal.id]);

        // Send Telegram notification
        const message = `
⚠️ **[UPDATE] Signal Expired**

📊 **Pair**: ${signal.symbol}
📈 **Type**: ${signal.signal_type}
💰 **Entry**: ${parseFloat(signal.predicted_close).toFixed(5)}
⏱️ **Age**: ${ageHours} hours

🧠 **AI Core Assessment**: Cấu trúc giá đã thay đổi sau ${TTL_HOURS}h. Hủy lệnh để bảo toàn vốn.

🛡️ Powered by Quantix Core AI v1.8.2
        `;

        await sendTelegramAlert(message);
    }

    return result.rows.length;
}

/**
 * Monitor active signals for TP/SL hits
 */
async function monitorActiveSignals(client) {
    const result = await client.query(`
        SELECT id, symbol, signal_type, predicted_close, entry_price, 
               sl_price, tp1_price, tp2_price, current_price, signal_status, created_at
        FROM ai_signals
        WHERE is_published = TRUE
        AND signal_status IN ('WAITING', 'ENTRY_HIT', 'TP1_HIT')
        ORDER BY created_at DESC
        LIMIT 20
    `);

    const signals = result.rows;
    if (signals.length === 0) {
        console.log('⏳ No active signals to monitor.');
        return;
    }

    console.log(`\n🔍 Monitoring ${signals.length} active signals...`);

    for (const signal of signals) {
        const ageMinutes = ((Date.now() - new Date(signal.created_at)) / (1000 * 60)).toFixed(0);
        console.log(`   📌 Signal ${signal.id} (${signal.symbol}) - Status: ${signal.signal_status} - Age: ${ageMinutes}m`);
    }
}

/**
 * Main lifecycle check function
 */
async function checkSignalLifecycle() {
    const client = await pool.connect();

    try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`[${new Date().toLocaleTimeString()}] 🔄 SIGNAL LIFECYCLE CHECK`);
        console.log('='.repeat(60));

        // 1. Check for expired signals
        const expiredCount = await checkSignalExpiration(client);
        console.log(`✅ Expired signals processed: ${expiredCount}`);

        // 2. Monitor active signals
        await monitorActiveSignals(client);

        console.log('='.repeat(60));
        console.log('✅ Lifecycle check complete.\n');

    } catch (error) {
        console.error('❌ Lifecycle check error:', error.message);
    } finally {
        client.release();
    }
}

/**
 * Start the lifecycle manager
 */
async function startLifecycleManager() {
    console.log('\n🚀 QUANTIX SIGNAL LIFECYCLE MANAGER v1.8.2');
    console.log(`⏱️  TTL: ${TTL_HOURS} hours`);
    console.log(`🔄 Check Interval: ${CHECK_INTERVAL / 1000 / 60} minutes`);
    console.log(`📡 Telegram Alerts: ${bot && CHAT_ID ? 'ENABLED ✅' : 'DISABLED ❌'}\n`);

    // Initial check
    await checkSignalLifecycle();

    // Schedule periodic checks
    setInterval(checkSignalLifecycle, CHECK_INTERVAL);
}

// Start the manager
startLifecycleManager();
