/**
 * QUANTIX ELITE v2.5.3 - DATA COMPLIANCE MONITOR
 * Chế độ 1: Strict Data Compliance
 * 
 * Monitors data freshness and triggers warnings when delay exceeds threshold
 */

import PRODUCTION_CONFIG from '../config/production.js';

export class DataComplianceMonitor {
    constructor() {
        this.lastDataTimestamp = null;
        this.isDelayed = false;
        this.delayWarningCallback = null;
    }

    /**
     * Register callback for delay warnings
     */
    onDelayWarning(callback) {
        this.delayWarningCallback = callback;
    }

    /**
     * Update last data timestamp
     */
    recordDataUpdate(timestamp) {
        this.lastDataTimestamp = timestamp ? new Date(timestamp) : new Date();
        this.checkCompliance();
    }

    /**
     * Check if data is compliant (within acceptable delay)
     */
    checkCompliance() {
        if (!this.lastDataTimestamp) return true;

        const now = new Date();
        const delaySeconds = (now - this.lastDataTimestamp) / 1000;
        const wasDelayed = this.isDelayed;

        this.isDelayed = delaySeconds > PRODUCTION_CONFIG.MAX_DATA_DELAY_SECONDS;

        // Trigger warning if state changed to delayed
        if (this.isDelayed && !wasDelayed && this.delayWarningCallback) {
            this.delayWarningCallback({
                type: 'MARKET_CONNECTION_DELAYED',
                delaySeconds: Math.round(delaySeconds),
                threshold: PRODUCTION_CONFIG.MAX_DATA_DELAY_SECONDS,
                message: `Market data delayed by ${Math.round(delaySeconds)}s. Trading actions locked for safety.`
            });
        }

        return !this.isDelayed;
    }

    /**
     * Get current compliance status
     */
    getStatus() {
        const delaySeconds = this.lastDataTimestamp
            ? (new Date() - this.lastDataTimestamp) / 1000
            : 0;

        return {
            isCompliant: !this.isDelayed,
            delaySeconds: Math.round(delaySeconds),
            threshold: PRODUCTION_CONFIG.MAX_DATA_DELAY_SECONDS,
            lastUpdate: this.lastDataTimestamp,
            tradingLocked: this.isDelayed
        };
    }

    /**
     * Force compliance check (call periodically)
     */
    tick() {
        this.checkCompliance();
    }
}

export default new DataComplianceMonitor();
