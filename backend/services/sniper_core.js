import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { calculatePips, formatPriceBlock, shouldExpireSignal } from './bot_utils.js';

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
 * QUANTIX SNIPER CORE v2.3.0
 * 🛡️ The Brain of the System
 * Logic: Auto-Expire (Shield) + 95% Sniper (Weapon)
 */

let lastPostDate = null;
let postedSignalToday = false;

// --- TELEGRAM BROADCASTER ---
async function broadcastToGroups(message, options = {}) {
    const groups = [VIP_GROUP, OFFICIAL_GROUP, COMMUNITY_GROUP].filter(g => g);
    for (const groupId of groups) {
        try {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: groupId,
                    text: message,
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true,
                    ...options
                })
            });
        } catch (e) {
            console.error(`Broadcast failed for ${groupId}:`, e.message);
        }
    }
}

// --- PHASE 1: SNIPER (95%+) ---
async function processSniper() {
    const today = new Date().toDateString();
    if (lastPostDate === today && postedSignalToday) return;

    if (lastPostDate !== today) {
        lastPostDate = today;
        postedSignalToday = false;
    }

    const { data: signals } = await supabase
        .from('ai_signals')
        .select('*')
        .gte('confidence', 95)
        .eq('status', 'WAITING')
        .is('metadata->broadcasted', null)
        .order('created_at', { ascending: false })
        .limit(1);

    if (signals && signals.length > 0) {
        const signal = signals[0];
        const message = `
🎯 **SNIPER SIGNAL - DAILY PICK**
━━━━━━━━━━━━━━━━━━
📊 **Asset**: \`${signal.symbol.replace('=X', '')}\`
🎬 **Action**: **${signal.action.includes('BUY') ? '🟢 LONG' : '🔴 SHORT'}**

💰 **Levels**:
${formatPriceBlock(signal)}

🧠 **AI Confidence**: **${signal.confidence}%** ⭐
🛡️ *Sniper Mode: 1 high-quality pick/day*
━━━━━━━━━━━━━━━━━━`;

        await broadcastToGroups(message);
        await supabase.from('ai_signals').update({
            metadata: { ...signal.metadata, broadcasted: true, broadcast_time: new Date().toISOString() }
        }).eq('id', signal.id);

        postedSignalToday = true;
        console.log(`🎯 SNIPER: Posted ${signal.symbol} (${signal.confidence}%)`);
    }
}

// --- PHASE 2: SHIELD (Auto-Expire) ---
async function processShield() {
    const { data: pending } = await supabase
        .from('ai_signals')
        .select('*')
        .in('status', ['WAITING', 'PENDING']);

    if (!pending) return;

    for (const signal of pending) {
        const { data: snapshot } = await supabase.from('market_snapshot').select('price').eq('symbol', signal.symbol).single();
        if (!snapshot) continue;

        if (shouldExpireSignal(signal, snapshot.price)) {
            const pips = calculatePips(signal.symbol, signal.entry_price, snapshot.price);

            await supabase.from('ai_signals').update({
                status: 'EXPIRED',
                metadata: { ...signal.metadata, expired_reason: `Price drifted ${Math.abs(pips).toFixed(1)} pips` }
            }).eq('id', signal.id);

            const msg = `
⚠️ **SIGNAL EXPIRED**
━━━━━━━━━━━━━━━━━━
📊 **Asset**: ${signal.symbol.replace('=X', '')}
🎬 **Action**: ${signal.action}
**Reason**: Price moved ${Math.abs(pips).toFixed(1)} pips from entry.

✅ **Capital Protected** - Sniper waiting for next hunt.
━━━━━━━━━━━━━━━━━━`;
            await broadcastToGroups(msg);
            console.log(`🛡️ SHIELD: Expired ${signal.symbol}`);
        }
    }
}

// --- PHASE 3: RESULT (Settlement) ---
async function processResults() {
    const { data: closed } = await supabase
        .from('ai_signals')
        .select('*')
        .in('status', ['TP1_HIT', 'TP2_HIT', 'SL_HIT'])
        .is('metadata->result_announced', null);

    if (!closed) return;

    for (const signal of closed) {
        const isWin = signal.status.includes('TP');
        const exitPrice = isWin ? signal.tp : signal.sl;
        const pips = calculatePips(signal.symbol, signal.entry_price, exitPrice);

        const msg = `
${isWin ? '✅' : '❌'} **FINAL RESULT: ${isWin ? 'WIN' : 'LOSS'}**
━━━━━━━━━━━━━━━━━━
📊 **Asset**: ${signal.symbol.replace('=X', '')}
📏 **Result**: ${isWin ? '🟢' : '🔴'} **${pips > 0 ? '+' : ''}${pips.toFixed(1)} pips**

${isWin ? '🎉 Target hit!' : '🛡️ SL protected capital'}
━━━━━━━━━━━━━━━━━━`;

        await broadcastToGroups(msg);
        await supabase.from('ai_signals').update({
            metadata: { ...signal.metadata, result_announced: true }
        }).eq('id', signal.id);
        console.log(`🏁 RESULT: ${signal.symbol} (${isWin ? 'WIN' : 'LOSS'})`);
    }
}

async function loop() {
    console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Sniper Core Pulse...`);
    await processSniper();
    await processShield();
    await processResults();
}

console.log('🚀 QUANTIX SNIPER CORE v2.3.0 - ONLINE');
loop();
setInterval(loop, 60000);
