import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { calculatePips, formatPriceBlock } from './bot_utils.js';

dotenv.config();

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const VIP_GROUP = process.env.GROUP_ID_VIP;
const OFFICIAL_GROUP = process.env.GROUP_ID_OFFICIAL;
const COMMUNITY_GROUP = process.env.GROUP_ID_COMMUNITY;

/**
 * TELEGRAM SNIPER AUTOPILOT v2.2.0
 * "1 Signal/Day - 95%+ Confidence Only"
 * 
 * Features:
 * - Auto-post signals with confidence > 95%
 * - Maximum 1 signal per day
 * - 3-phase lifecycle: Signal → Expiry → Result
 * - Multi-group broadcasting
 */

// Track posted signals to enforce 1/day limit
let lastPostDate = null;
let postedSignalToday = false;

async function sendToTelegram(chatId, message, options = {}) {
    if (!TELEGRAM_TOKEN || !chatId) return null;

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
                ...options
            })
        });

        const data = await response.json();
        return data.ok ? data.result : null;
    } catch (e) {
        console.error(`Failed to send to ${chatId}:`, e.message);
        return null;
    }
}

async function broadcastToGroups(message, options = {}) {
    const groups = [VIP_GROUP, OFFICIAL_GROUP, COMMUNITY_GROUP].filter(g => g);
    const results = [];

    for (const groupId of groups) {
        const result = await sendToTelegram(groupId, message, options);
        if (result) {
            results.push({ groupId, messageId: result.message_id });
        }
    }

    return results;
}

function formatSniperSignal(signal) {
    const { symbol, action, entry_price, tp, sl, confidence } = signal;

    const priceBlock = formatPriceBlock(signal);
    const tpPips = Math.abs(calculatePips(symbol, entry_price, tp));
    const slPips = Math.abs(calculatePips(symbol, entry_price, sl));
    const riskReward = (tpPips / slPips).toFixed(2);

    return `
🎯 **SNIPER SIGNAL - DAILY PICK**
━━━━━━━━━━━━━━━━━━

📊 **Asset**: \`${symbol.replace('=X', '')}\`
🎬 **Direction**: **${action === 'BUY' || action === 'BULLISH' ? '🟢 LONG' : '🔴 SHORT'}**

💰 **Price Levels**:
${priceBlock}

📏 **Risk Management**:
• TP Target: **${tpPips.toFixed(1)} pips**
• SL Protection: **${slPips.toFixed(1)} pips**
• Risk:Reward: **1:${riskReward}**

🧠 **AI Confidence**: **${confidence}%** ⭐

⏰ **Posted**: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })} ICT

🛡️ *Quantix Sniper Mode - Only the best setups*
━━━━━━━━━━━━━━━━━━`;
}

function formatExpiryNotification(signal, reason) {
    const { symbol, action, entry_price } = signal;

    return `
⚠️ **SIGNAL EXPIRED**
━━━━━━━━━━━━━━━━━━

📊 **Asset**: \`${symbol.replace('=X', '')}\`
🎬 **Direction**: ${action === 'BUY' || action === 'BULLISH' ? '🟢 LONG' : '🔴 SHORT'}
💰 **Entry**: \`${entry_price.toFixed(5)}\`

**Reason**: ${reason}

✅ **Capital Protected** - No trade executed

🛡️ *Better to miss than to force a bad entry*
━━━━━━━━━━━━━━━━━━`;
}

function formatFinalResult(signal, result) {
    const { symbol, action, entry_price, tp, sl } = signal;
    const { status, exit_price } = result;

    const isWin = status === 'TP1_HIT' || status === 'TP2_HIT';
    const pips = calculatePips(symbol, entry_price, exit_price);

    const emoji = isWin ? '✅' : '❌';
    const resultText = isWin ? '**WIN**' : '**LOSS**';
    const color = isWin ? '🟢' : '🔴';

    return `
${emoji} **FINAL RESULT: ${resultText}**
━━━━━━━━━━━━━━━━━━

📊 **Asset**: \`${symbol.replace('=X', '')}\`
🎬 **Direction**: ${action === 'BUY' || action === 'BULLISH' ? '🟢 LONG' : '🔴 SHORT'}

💰 **Entry**: \`${entry_price.toFixed(5)}\`
🎯 **Exit**: \`${exit_price.toFixed(5)}\`

📏 **Result**: ${color} **${pips > 0 ? '+' : ''}${pips.toFixed(1)} pips**

${isWin ? '🎉 Target achieved!' : '🛡️ Stop loss protected capital'}

⏰ **Closed**: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })} ICT

🛡️ *Quantix Sniper - Precision Trading*
━━━━━━━━━━━━━━━━━━`;
}

async function checkAndPostNewSignal() {
    try {
        // Check if we already posted today
        const today = new Date().toDateString();
        if (lastPostDate === today && postedSignalToday) {
            console.log('✅ Already posted 1 signal today. Sniper mode: Standing by...');
            return;
        }

        // Reset daily counter if new day
        if (lastPostDate !== today) {
            lastPostDate = today;
            postedSignalToday = false;
        }

        // Get latest high-confidence signal
        const { data: signals, error } = await supabase
            .from('ai_signals')
            .select('*')
            .gte('confidence', 95) // 95%+ only
            .eq('status', 'WAITING')
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (!signals || signals.length === 0) {
            console.log('🎯 No 95%+ confidence signals yet. Sniper waiting...');
            return;
        }

        const signal = signals[0];

        // Check if already broadcasted
        if (signal.metadata?.broadcasted) {
            console.log('✅ Signal already broadcasted');
            return;
        }

        // POST SIGNAL (Phase 1)
        console.log(`\n🎯 SNIPER ACTIVATED: ${signal.symbol} @ ${signal.confidence}% confidence`);

        const message = formatSniperSignal(signal);
        const broadcasts = await broadcastToGroups(message);

        if (broadcasts.length > 0) {
            // Mark as broadcasted
            await supabase
                .from('ai_signals')
                .update({
                    metadata: {
                        ...signal.metadata,
                        broadcasted: true,
                        broadcast_time: new Date().toISOString(),
                        broadcast_groups: broadcasts
                    }
                })
                .eq('id', signal.id);

            postedSignalToday = true;
            console.log(`✅ Signal broadcasted to ${broadcasts.length} group(s)`);
            console.log('🎯 Sniper mode: Daily quota filled. Standing down until tomorrow.');
        }

    } catch (e) {
        console.error('❌ Sniper Post Error:', e.message);
    }
}

async function checkAndPostExpiries() {
    try {
        // Get expired signals that haven't been announced
        const { data: expiredSignals, error } = await supabase
            .from('ai_signals')
            .select('*')
            .eq('status', 'EXPIRED')
            .is('metadata->expiry_announced', null)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        if (!expiredSignals || expiredSignals.length === 0) return;

        for (const signal of expiredSignals) {
            // POST EXPIRY (Phase 2)
            const reason = signal.metadata?.expired_reason || 'Price moved beyond safe entry zone';
            const message = formatExpiryNotification(signal, reason);

            await broadcastToGroups(message);

            // Mark as announced
            await supabase
                .from('ai_signals')
                .update({
                    metadata: {
                        ...signal.metadata,
                        expiry_announced: true,
                        expiry_announce_time: new Date().toISOString()
                    }
                })
                .eq('id', signal.id);

            console.log(`⚠️ Expiry announced for ${signal.symbol}`);
        }

    } catch (e) {
        console.error('❌ Expiry Check Error:', e.message);
    }
}

async function checkAndPostResults() {
    try {
        // Get closed signals that haven't been announced
        const { data: closedSignals, error } = await supabase
            .from('ai_signals')
            .select('*')
            .in('status', ['TP1_HIT', 'TP2_HIT', 'SL_HIT'])
            .is('metadata->result_announced', null)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        if (!closedSignals || closedSignals.length === 0) return;

        for (const signal of closedSignals) {
            // POST RESULT (Phase 3)
            const result = {
                status: signal.status,
                exit_price: signal.status.includes('TP') ? signal.tp : signal.sl
            };

            const message = formatFinalResult(signal, result);
            await broadcastToGroups(message);

            // Mark as announced
            await supabase
                .from('ai_signals')
                .update({
                    metadata: {
                        ...signal.metadata,
                        result_announced: true,
                        result_announce_time: new Date().toISOString()
                    }
                })
                .eq('id', signal.id);

            const resultType = signal.status.includes('TP') ? 'WIN' : 'LOSS';
            console.log(`${resultType === 'WIN' ? '✅' : '❌'} Result announced for ${signal.symbol}: ${resultType}`);
        }

    } catch (e) {
        console.error('❌ Result Check Error:', e.message);
    }
}

async function sniperLoop() {
    console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Sniper Autopilot: Scanning...`);

    // Phase 1: Check for new 95%+ signals
    await checkAndPostNewSignal();

    // Phase 2: Check for expiries
    await checkAndPostExpiries();

    // Phase 3: Check for final results
    await checkAndPostResults();
}

async function runSniperAutopilot() {
    console.log('\n🎯 TELEGRAM SNIPER AUTOPILOT v2.2.0');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Rules:');
    console.log('   • Confidence threshold: 95%+');
    console.log('   • Daily limit: 1 signal');
    console.log('   • Lifecycle: Signal → Expiry → Result');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Run first check immediately
    await sniperLoop();

    // Then run every 60 seconds
    setInterval(sniperLoop, 60000);
}

// Global error handler
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err);
});

runSniperAutopilot();
