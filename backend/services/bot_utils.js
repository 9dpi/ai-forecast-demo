/**
 * QUANTIX BOT UTILITIES v2.1.0
 * Enterprise-grade calculation and validation functions
 */

/**
 * Calculate Pips - Pepperstone Standard
 * @param {string} symbol - Trading symbol (e.g., "EURUSD=X", "XAUUSD")
 * @param {number} entry - Entry price
 * @param {number} exit - Exit price
 * @returns {number} Pips value (positive for profit, negative for loss)
 */
export function calculatePips(symbol, entry, exit) {
    // Normalize symbol
    const normalizedSymbol = symbol.toUpperCase().replace('=X', '');

    // Gold/XAU: 1 unit = 10 pips
    if (normalizedSymbol.includes('XAU') || normalizedSymbol.includes('GOLD')) {
        return parseFloat(((exit - entry) * 10).toFixed(1));
    }

    // JPY pairs: 0.01 = 1 pip (3 decimal precision)
    if (normalizedSymbol.includes('JPY')) {
        return parseFloat(((exit - entry) * 100).toFixed(1));
    }

    // Standard Forex: 0.0001 = 1 pip (5 decimal precision)
    return parseFloat(((exit - entry) * 10000).toFixed(1));
}

/**
 * Check if signal should be auto-expired
 * @param {object} signal - Signal object from database
 * @param {number} currentPrice - Current market price
 * @returns {boolean} True if should expire
 */
export function shouldExpireSignal(signal, currentPrice) {
    const { action, entry_price, status } = signal;

    // Only check pending signals
    if (status !== 'WAITING' && status !== 'PENDING') {
        return false;
    }

    const EXPIRE_THRESHOLD_PIPS = 10;
    const pipsDiff = calculatePips(signal.symbol, entry_price, currentPrice);

    // BUY signal: Expire if price moved up too much (missed entry)
    if (action === 'BUY' || action === 'BULLISH') {
        return pipsDiff > EXPIRE_THRESHOLD_PIPS;
    }

    // SELL signal: Expire if price moved down too much (missed entry)
    if (action === 'SELL' || action === 'BEARISH') {
        return pipsDiff < -EXPIRE_THRESHOLD_PIPS;
    }

    return false;
}

/**
 * Determine user access level based on chat ID
 * @param {number} chatId - Telegram chat ID
 * @param {object} groupIds - Object with VIP_GROUP, OFFICIAL_GROUP, COMMUNITY_GROUP
 * @returns {string} 'VIP' | 'OFFICIAL' | 'COMMUNITY' | 'PRIVATE'
 */
export function getUserAccessLevel(chatId, groupIds) {
    if (chatId.toString() === groupIds.VIP_GROUP) return 'VIP';
    if (chatId.toString() === groupIds.OFFICIAL_GROUP) return 'OFFICIAL';
    if (chatId.toString() === groupIds.COMMUNITY_GROUP) return 'COMMUNITY';
    return 'PRIVATE'; // Direct message
}

/**
 * Format price with proper decimal precision
 * @param {number} price - Price value
 * @param {string} symbol - Trading symbol
 * @returns {string} Formatted price
 */
export function formatPrice(price, symbol) {
    const normalizedSymbol = symbol.toUpperCase().replace('=X', '');

    // Gold: 2 decimals
    if (normalizedSymbol.includes('XAU') || normalizedSymbol.includes('GOLD')) {
        return price.toFixed(2);
    }

    // JPY: 3 decimals
    if (normalizedSymbol.includes('JPY')) {
        return price.toFixed(3);
    }

    // Standard Forex: 5 decimals
    return price.toFixed(5);
}

/**
 * Generate monospace formatted price block
 * @param {object} signal - Signal object
 * @returns {string} Formatted text block
 */
export function formatPriceBlock(signal) {
    const { symbol, entry_price, tp, sl, action } = signal;

    const entry = formatPrice(entry_price, symbol);
    const takeProfit = formatPrice(tp, symbol);
    const stopLoss = formatPrice(sl, symbol);

    return `\`\`\`
Entry: ${entry}
TP:    ${takeProfit}
SL:    ${stopLoss}
\`\`\``;
}

/**
 * Calculate signal performance metrics
 * @param {array} signals - Array of closed signals
 * @returns {object} Performance stats
 */
export function calculatePerformance(signals) {
    const closedSignals = signals.filter(s =>
        ['TP1_HIT', 'TP2_HIT', 'SL_HIT', 'EXPIRED'].includes(s.status)
    );

    if (closedSignals.length === 0) {
        return {
            totalSignals: 0,
            wins: 0,
            losses: 0,
            winRate: 0,
            totalPips: 0,
            avgPips: 0
        };
    }

    let totalPips = 0;
    let wins = 0;
    let losses = 0;

    closedSignals.forEach(signal => {
        const { status, entry_price, tp, sl, symbol } = signal;

        if (status === 'TP1_HIT' || status === 'TP2_HIT') {
            wins++;
            const pips = calculatePips(symbol, entry_price, tp);
            totalPips += Math.abs(pips);
        } else if (status === 'SL_HIT') {
            losses++;
            const pips = calculatePips(symbol, entry_price, sl);
            totalPips -= Math.abs(pips);
        }
    });

    return {
        totalSignals: closedSignals.length,
        wins,
        losses,
        winRate: closedSignals.length > 0 ? ((wins / closedSignals.length) * 100).toFixed(1) : 0,
        totalPips: totalPips.toFixed(1),
        avgPips: (totalPips / closedSignals.length).toFixed(1)
    };
}
