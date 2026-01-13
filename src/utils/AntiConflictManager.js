/**
 * QUANTIX ELITE v2.5.3 - ANTI-CONFLICT MANAGER
 * Chế độ 3: Anti-Conflict Logic
 * 
 * Automatically hides old signals and prevents conflicting information
 */

import PRODUCTION_CONFIG from '../config/production.js';

export class AntiConflictManager {
    /**
     * Check if signal is expired
     */
    static isSignalExpired(signal) {
        if (!signal.timestamp && !signal.created_at) return false;

        const signalTime = new Date(signal.timestamp || signal.created_at);
        const now = new Date();
        const ageHours = (now - signalTime) / (1000 * 60 * 60);

        return ageHours > PRODUCTION_CONFIG.SIGNAL_EXPIRY_HOURS;
    }

    /**
     * Filter out expired signals
     */
    static filterActiveSignals(signals) {
        if (!PRODUCTION_CONFIG.AUTO_HIDE_OLD_SIGNALS) {
            return signals;
        }

        return signals.filter(signal => !this.isSignalExpired(signal));
    }

    /**
     * Detect conflicting signals (opposite directions for same symbol)
     */
    static detectConflicts(signals) {
        const conflicts = [];
        const symbolMap = new Map();

        signals.forEach(signal => {
            const key = signal.symbol || signal.pair;
            if (!symbolMap.has(key)) {
                symbolMap.set(key, []);
            }
            symbolMap.get(key).push(signal);
        });

        symbolMap.forEach((signalsForSymbol, symbol) => {
            if (signalsForSymbol.length > 1) {
                const actions = new Set(signalsForSymbol.map(s => s.action));

                // Conflict if both BUY and SELL exist
                if (actions.has('BUY') && actions.has('SELL')) {
                    conflicts.push({
                        symbol,
                        type: 'OPPOSITE_DIRECTIONS',
                        signals: signalsForSymbol,
                        resolution: 'KEEP_LATEST',
                        message: `Conflicting signals detected for ${symbol}. Showing latest only.`
                    });
                }
            }
        });

        return conflicts;
    }

    /**
     * Resolve conflicts by keeping only the latest signal per symbol
     */
    static resolveConflicts(signals) {
        const symbolMap = new Map();

        // Group by symbol and keep latest
        signals.forEach(signal => {
            const key = signal.symbol || signal.pair;
            const existing = symbolMap.get(key);

            if (!existing) {
                symbolMap.set(key, signal);
            } else {
                const existingTime = new Date(existing.timestamp || existing.created_at);
                const currentTime = new Date(signal.timestamp || signal.created_at);

                if (currentTime > existingTime) {
                    symbolMap.set(key, signal);
                }
            }
        });

        return Array.from(symbolMap.values());
    }

    /**
     * Get clean signal set (active + conflict-free)
     */
    static getCleanSignals(signals) {
        // Step 1: Remove expired
        let cleanSignals = this.filterActiveSignals(signals);

        // Step 2: Detect conflicts
        const conflicts = this.detectConflicts(cleanSignals);

        // Step 3: Resolve conflicts if any
        if (conflicts.length > 0 && PRODUCTION_CONFIG.ENABLE_CONFLICT_DETECTION) {
            cleanSignals = this.resolveConflicts(cleanSignals);
        }

        return {
            signals: cleanSignals,
            conflicts,
            removed: signals.length - cleanSignals.length
        };
    }

    /**
     * Get signal age in human-readable format
     */
    static getSignalAge(signal) {
        const signalTime = new Date(signal.timestamp || signal.created_at);
        const now = new Date();
        const ageMinutes = (now - signalTime) / (1000 * 60);

        if (ageMinutes < 60) {
            return `${Math.round(ageMinutes)}m ago`;
        }

        const ageHours = ageMinutes / 60;
        if (ageHours < 24) {
            return `${Math.round(ageHours)}h ago`;
        }

        return `${Math.round(ageHours / 24)}d ago`;
    }
}

export default AntiConflictManager;
