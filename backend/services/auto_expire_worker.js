import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { shouldExpireSignal, calculatePips } from './bot_utils.js';

dotenv.config();

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * AUTO-EXPIRE WORKER v2.1.0
 * Scans pending signals and auto-expires those that missed entry zone
 * Runs every 60 seconds
 */

async function sendTelegramAlert(message) {
    if (!TELEGRAM_TOKEN || !ADMIN_CHAT_ID) return;

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.error('Failed to send Telegram alert:', e);
    }
}

async function checkAndExpireSignals() {
    try {
        console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Auto-Expire Worker: Scanning pending signals...`);

        // Get all pending signals
        const { data: pendingSignals, error } = await supabase
            .from('ai_signals')
            .select('*')
            .in('status', ['WAITING', 'PENDING'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!pendingSignals || pendingSignals.length === 0) {
            console.log('✅ No pending signals to check.');
            return;
        }

        console.log(`📊 Found ${pendingSignals.length} pending signal(s)`);

        let expiredCount = 0;

        for (const signal of pendingSignals) {
            // Get current market price from market_snapshot
            const { data: snapshot } = await supabase
                .from('market_snapshot')
                .select('price')
                .eq('symbol', signal.symbol)
                .single();

            if (!snapshot) continue;

            const currentPrice = snapshot.price;

            // Check if should expire
            if (shouldExpireSignal(signal, currentPrice)) {
                const pipsDiff = calculatePips(signal.symbol, signal.entry_price, currentPrice);

                // Update signal status to EXPIRED
                const { error: updateError } = await supabase
                    .from('ai_signals')
                    .update({
                        status: 'EXPIRED',
                        metadata: {
                            ...signal.metadata,
                            expired_at: new Date().toISOString(),
                            expired_reason: `Price moved ${Math.abs(pipsDiff).toFixed(1)} pips away from entry zone`,
                            current_price_at_expire: currentPrice
                        }
                    })
                    .eq('id', signal.id);

                if (!updateError) {
                    expiredCount++;

                    const alertMessage = `⚠️ **Signal Auto-Expired**

📊 **Asset**: ${signal.symbol}
🎬 **Action**: ${signal.action}
💰 **Entry**: ${signal.entry_price.toFixed(5)}
📍 **Current**: ${currentPrice.toFixed(5)}
📏 **Drift**: ${Math.abs(pipsDiff).toFixed(1)} pips

**Reason**: Price moved beyond safe entry zone (+10 pips threshold)

🛡️ *Auto-protection activated to preserve capital*`;

                    await sendTelegramAlert(alertMessage);

                    console.log(`🚫 EXPIRED: ${signal.symbol} ${signal.action} - Drifted ${Math.abs(pipsDiff).toFixed(1)} pips`);
                }
            }
        }

        if (expiredCount > 0) {
            console.log(`\n✅ Auto-Expire Complete: ${expiredCount} signal(s) expired`);
        } else {
            console.log('✅ All pending signals within safe entry zone');
        }

    } catch (e) {
        console.error('❌ Auto-Expire Worker Error:', e.message);
        await sendTelegramAlert(`🚨 Auto-Expire Worker Error: ${e.message}`);
    }
}

async function runWorker() {
    console.log('\n🤖 Auto-Expire Worker v2.1.0 - STARTING');
    console.log('⏱️  Check Interval: 60 seconds');
    console.log('🎯 Expire Threshold: 10 pips\n');

    // Run first check immediately
    await checkAndExpireSignals();

    // Then run every 60 seconds
    setInterval(checkAndExpireSignals, 60000);
}

// Global error handler
process.on('uncaughtException', async (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err);
    await sendTelegramAlert(`💥 Worker Crash: ${err.message}`);
});

runWorker();
