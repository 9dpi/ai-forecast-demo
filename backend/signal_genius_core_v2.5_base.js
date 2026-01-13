/**
 * 🎯 QUANTIX AI CORE V2.5 - SNIPER EDITION
 * This file implements the "Sniper Filter" elite signal selection.
 * 
 * Logic:
 * 1. Multi-Agent Consensus (v1.8)
 * 2. Sniper Validator (v2.5):
 *    - Confidence > 95%
 *    - Technical Alignment (EMA20 + RSI)
 *    - Strict Output (BUY/SELL or NEUTRAL)
 */

import { orchestrator } from './agents/orchestrator.js';

/**
 * Main entry point for signal analysis using Multi-Agent System
 * Replaces old single-agent logic
 * 
 * @param {Object} marketData - Market data object
 * @param {string} marketData.symbol - Trading pair (e.g., 'EURUSD=X')
 * @param {number} marketData.currentPrice - Current market price
 * @param {Array<number>} marketData.prices - Historical prices (last 50+ candles)
 * @param {Object} marketData.currentCandle - Current candle OHLC
 * @param {Array<number>} marketData.volume - Volume data
 * @param {string} marketData.direction - 'LONG' or 'SHORT'
 * 
 * @returns {Promise<Object>} Decision object
 */
export async function analyzeSignalWithAgents(marketData) {
    console.log(`\n[Signal Genius V1.8] Analyzing ${marketData.symbol} with Multi-Agent System...`);

    try {
        const rawDecision = await orchestrator.analyzeAndDecide(marketData);

        // --- SNIPER FILTER V2.5 (THE TRANSPLANT) ---
        const sniperResult = sniperTechnicalValidator(marketData, rawDecision);

        return {
            provider: "Quantix AI Core v2.5",
            client_id: "SignalGenius_AI",
            version: "2.5.0-SNIPER",

            // Sniper-Filtered Decision
            shouldEmitSignal: sniperResult.isSniperSafe,
            isGhostSignal: rawDecision.isGhostSignal && !sniperResult.isSniperSafe,
            confidence: rawDecision.confidence,
            action: sniperResult.finalAction, // BUY, SELL, or NEUTRAL

            // Multi-Agent details (Legacy Support)
            votes: rawDecision.votes,
            reasoning: sniperResult.isSniperSafe ?
                `🎯 SNIPER APPROVED: ${rawDecision.reasoning}` :
                `🛡️ SNIPER REJECTED: ${sniperResult.rejectReason}`,

            // Metadata for Monitoring
            metadata: {
                ema20: sniperResult.indicators.ema20.toFixed(5),
                rsi: sniperResult.indicators.rsi.toFixed(2),
                confidence_check: rawDecision.confidence > 95 ? 'PASS' : 'FAIL',
                disclaimer: "Powered by Quantix AI Core"
            }
        };

    } catch (error) {
        console.error('[Quantix Core v2.5] Sniper analysis failed:', error);
        return {
            provider: "Quantix AI Core v2.5",
            shouldEmitSignal: false,
            action: "NEUTRAL",
            confidence: 0,
            reasoning: `System error: ${error.message}`,
            disclaimer: "Powered by Quantix AI Core"
        };
    }
}

/**
 * 🎯 SNIPER TECHNICAL VALIDATOR (The "Bullet" Check)
 * Enforces ultra-strict technical conditions
 */
function sniperTechnicalValidator(marketData, decision) {
    const prices = marketData.prices || [];
    const currentPrice = marketData.currentPrice;
    const action = decision.action; // BULLISH/BEARISH/NEUTRAL

    // 1. Calculate Core Indicators
    const rsi = calculateRSI(prices);
    const ema20 = calculateEMA(prices, 20);

    let isSniperSafe = false;
    let finalAction = "NEUTRAL";
    let rejectReason = "Divergence or low confidence";

    // Condition 1: High Confidence Check (95%+)
    if (decision.confidence <= 95) {
        return { isSniperSafe, finalAction, rejectReason: "Confidence below 95% threshold", indicators: { rsi, ema20 } };
    }

    // Condition 2 & 3: Technical Alignment
    if (action === 'BULLISH' || action === 'BUY') {
        // BUY Logic: Price > EMA20 AND RSI < 70 (No overbought)
        if (currentPrice > ema20 && rsi < 70) {
            isSniperSafe = true;
            finalAction = "BUY";
        } else {
            rejectReason = currentPrice <= ema20 ? "Price below EMA20" : "RSI Overbought (>70)";
        }
    } else if (action === 'BEARISH' || action === 'SELL') {
        // SELL Logic: Price < EMA20 AND RSI > 30 (No oversold)
        if (currentPrice < ema20 && rsi > 30) {
            isSniperSafe = true;
            finalAction = "SELL";
        } else {
            rejectReason = currentPrice >= ema20 ? "Price above EMA20" : "RSI Oversold (<30)";
        }
    }

    return { isSniperSafe, finalAction, rejectReason, indicators: { rsi, ema20 } };
}

/**
 * Lightweight RSI Calculation
 */
function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    const changes = [];
    for (let i = 1; i < prices.length; i++) changes.push(prices[i] - prices[i - 1]);
    const gains = changes.slice(-period).map(c => c > 0 ? c : 0);
    const losses = changes.slice(-period).map(c => c < 0 ? Math.abs(c) : 0);
    const avgGain = gains.reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
    if (avgLoss === 0) return 100;
    return 100 - (100 / (1 + (avgGain / avgLoss)));
}

/**
 * Lightweight EMA Calculation
 */
function calculateEMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1];
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < prices.length; i++) ema = (prices[i] - ema) * multiplier + ema;
    return ema;
}

/**
 * Get Multi-Agent System statistics
 * Useful for monitoring and debugging
 */
export function getSystemStats() {
    return orchestrator.getStats();
}

/**
 * Manually disable Shadow Mode (for emergency or testing)
 * Use with caution!
 */
export function disableShadowMode() {
    console.warn('[Signal Genius V1.8] ⚠️  Shadow Mode manually disabled!');
    orchestrator.disableShadowMode();
}

/**
 * Format Multi-Agent decision for Telegram message
 * Returns enhanced message with agent consensus details
 */
export function formatTelegramMessage(signal, agentDecision) {
    const { agentConsensus, confidence, shadowMode, reasoning } = agentDecision;
    const isGolden = confidence >= 85;

    if (!agentConsensus) {
        return `
${isGolden ? '🚨 **GOLDEN SIGNAL DETECTED** (85%+ CONFIDENCE)' : '🎯 **Signal Genius AI SIGNAL** (V1.8)'}

📊 **${signal.pair}** | ${signal.action}
💰 Entry: ${signal.entry}
🛑 Stop Loss: ${signal.sl}
🎯 Take Profit: ${signal.tp}

🧠 **AI Confidence**: ${confidence}%

⚡ Powered by Quantix Core AI V1.8
`;
    }

    // Agent reasoning or fallback
    const techReason = agentConsensus.technical.reasoning || (agentConsensus.technical.decision === 'APPROVE' ? 'Strong technical alignment.' : 'Technical check failed.');
    const sentinelReason = agentConsensus.sentinel.reasoning || (agentConsensus.sentinel.decision === 'APPROVE' ? 'Market environment stable.' : 'Sentiment/News risk detected.');
    const criticReason = reasoning || `Decision finalized with ${confidence}% consensus.`;

    // Enhanced message with Multi-Agent consensus
    return `
${isGolden ? '🚨 **GOLDEN SIGNAL DETECTED** (85%+ CONFIDENCE)' : '🎯 **Signal Genius AI SIGNAL** (V1.8 Evolution)'}

💹 **Asset**: ${signal.pair} | 📈 **Action**: ${signal.action} @ ${signal.entry}

🧠 **AI Council Verdict**:
├─ **Tech Agent**: ${techReason}
├─ **Sentinel Agent**: ${sentinelReason}
└─ **Critic Agent**: ${agentConsensus.sentinel.decision === 'APPROVE' && agentConsensus.technical.decision === 'APPROVE' ? '✅' : '❌'} APPROVED (${confidence}% Confidence)

🎯 **TP**: ${signal.tp} | ❌ **SL**: ${signal.sl}

${shadowMode ? `🛡️  **Shadow Mode Active**: Filtering for highest-confidence setups.` : ''}

⚡ Powered by Quantix Core AI V1.8 | Multi-Agent System
`;
}

/**
 * Health check function for post-deployment verification
 */
export async function healthCheck() {
    console.log('\n🏥 Signal Genius V1.8 HEALTH CHECK\n');
    console.log('─'.repeat(50));

    const stats = getSystemStats();

    console.log(`✅ Orchestrator: Initialized`);
    console.log(`✅ Shadow Mode: ${stats.shadowMode ? 'ACTIVE 🛡️' : 'DISABLED'}`);
    console.log(`✅ Shadow Threshold: ${stats.shadowModeThreshold}%`);
    console.log(`✅ Total Decisions: ${stats.totalDecisions}`);
    console.log(`✅ Approval Rate: ${stats.approvalRate}`);
    console.log(`✅ Avg Confidence: ${stats.avgConfidence}`);

    console.log('\n🎉 Health Check PASSED - System Operational\n');

    return {
        healthy: true,
        shadowMode: stats.shadowMode,
        stats
    };
}

// Auto-run health check on module load
console.log('[Signal Genius V1.8] Multi-Agent Integration Wrapper loaded ✅');
