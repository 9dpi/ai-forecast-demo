/**
 * QUANTIX ELITE v2.5.3 - SNIPER EXECUTION FILTER
 * Chế độ 2: Sniper Execution
 * 
 * Only allows signals with >95% confidence and full agent consensus
 */

import PRODUCTION_CONFIG from '../config/production.js';

export class SniperExecutionFilter {
    /**
     * Validate if signal meets Sniper criteria
     */
    static validateSignal(signal) {
        const errors = [];

        // Check 1: Confidence threshold
        const confidence = parseFloat(signal.confidence) || 0;
        if (confidence < PRODUCTION_CONFIG.MIN_CONFIDENCE_THRESHOLD) {
            errors.push({
                code: 'LOW_CONFIDENCE',
                message: `Signal confidence ${confidence}% below threshold ${PRODUCTION_CONFIG.MIN_CONFIDENCE_THRESHOLD}%`,
                severity: 'CRITICAL'
            });
        }

        // Check 2: Agent consensus (if required)
        if (PRODUCTION_CONFIG.REQUIRE_AGENT_CONSENSUS && signal.votes) {
            const techApproved = signal.votes.technical?.decision === 'APPROVE';
            const sentinelApproved = signal.votes.sentinel?.decision === 'APPROVE';

            if (!techApproved || !sentinelApproved) {
                errors.push({
                    code: 'CONSENSUS_FAILED',
                    message: 'Not all agents approved this signal',
                    severity: 'CRITICAL',
                    details: {
                        technical: techApproved ? 'APPROVED' : 'REJECTED',
                        sentinel: sentinelApproved ? 'APPROVED' : 'REJECTED'
                    }
                });
            }
        }

        // Check 3: Action validity
        if (!['BUY', 'SELL'].includes(signal.action)) {
            errors.push({
                code: 'INVALID_ACTION',
                message: `Signal action "${signal.action}" is not executable`,
                severity: 'CRITICAL'
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            confidence,
            canExecute: errors.length === 0
        };
    }

    /**
     * Filter array of signals to only Sniper-grade
     */
    static filterSignals(signals) {
        return signals
            .map(signal => ({
                ...signal,
                validation: this.validateSignal(signal)
            }))
            .filter(signal => signal.validation.isValid);
    }

    /**
     * Get execution status for UI display
     */
    static getExecutionStatus(signal) {
        const validation = this.validateSignal(signal);

        if (validation.isValid) {
            return {
                status: 'SNIPER_APPROVED',
                badge: '🎯 ELITE',
                color: 'green',
                message: `Sniper-grade signal (${validation.confidence}% confidence)`,
                tradable: true
            };
        }

        return {
            status: 'SNIPER_REJECTED',
            badge: '🛡️ FILTERED',
            color: 'red',
            message: validation.errors[0]?.message || 'Signal does not meet Sniper criteria',
            tradable: false,
            errors: validation.errors
        };
    }
}

export default SniperExecutionFilter;
