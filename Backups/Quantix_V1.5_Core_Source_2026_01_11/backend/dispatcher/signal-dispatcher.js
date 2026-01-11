import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const MVP_API_URL = process.env.MVP_API_URL || 'http://localhost:5173/api/v1/internal/signals';
const INTERNAL_AUTH_KEY = process.env.INTERNAL_AUTH_KEY;

/**
 * Signal Dispatcher - Sends signals from Core to MVP
 * This is the bridge between Quantix AI Core (Brain) and MVP Frontend (Face)
 */

/**
 * Dispatch a new signal to the MVP system
 * @param {Object} signal - StandardSignal object conforming to signal-schema.json
 * @returns {Promise<Object>} Response from MVP
 */
export async function dispatchSignal(signal) {
    try {
        console.log(`📡 Dispatching signal ${signal.signal_id} to MVP...`);

        const response = await fetch(MVP_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': INTERNAL_AUTH_KEY
            },
            body: JSON.stringify(signal),
            timeout: 10000 // 10 second timeout
        });

        if (!response.ok) {
            throw new Error(`MVP returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`✅ Signal ${signal.signal_id} dispatched successfully`);
        return result;

    } catch (error) {
        console.error(`❌ Failed to dispatch signal ${signal.signal_id}:`, error.message);
        throw error;
    }
}

/**
 * Dispatch a status update for an existing signal
 * @param {string} signalId - UUID of the signal
 * @param {string} newStatus - New status (ENTRY_HIT, TP1_HIT, etc.)
 * @param {number} currentPrice - Current market price
 * @returns {Promise<Object>} Response from MVP
 */
export async function dispatchStatusUpdate(signalId, newStatus, currentPrice) {
    try {
        console.log(`📡 Updating signal ${signalId} status to ${newStatus}...`);

        const update = {
            signal_id: signalId,
            status: newStatus,
            current_price: currentPrice,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(`${MVP_API_URL}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': INTERNAL_AUTH_KEY
            },
            body: JSON.stringify(update),
            timeout: 10000
        });

        if (!response.ok) {
            throw new Error(`MVP returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`✅ Signal ${signalId} status updated to ${newStatus}`);
        return result;

    } catch (error) {
        console.error(`❌ Failed to update signal ${signalId}:`, error.message);
        throw error;
    }
}

/**
 * Batch dispatch multiple signals
 * @param {Array<Object>} signals - Array of StandardSignal objects
 * @returns {Promise<Array>} Results for each signal
 */
export async function dispatchBatch(signals) {
    console.log(`📡 Dispatching batch of ${signals.length} signals...`);

    const results = await Promise.allSettled(
        signals.map(signal => dispatchSignal(signal))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Batch complete: ${successful} successful, ${failed} failed`);
    return results;
}

/**
 * Health check - Verify MVP is reachable
 * @returns {Promise<boolean>} True if MVP is healthy
 */
export async function checkMVPHealth() {
    try {
        const healthUrl = MVP_API_URL.replace('/signals', '/health');
        const response = await fetch(healthUrl, {
            method: 'GET',
            headers: { 'x-auth-token': INTERNAL_AUTH_KEY },
            timeout: 5000
        });

        return response.ok;
    } catch (error) {
        console.error('❌ MVP health check failed:', error.message);
        return false;
    }
}

// Example usage (for testing)
if (import.meta.url === `file://${process.argv[1]}`) {
    const testSignal = {
        signal_id: "test-" + Date.now(),
        timestamp: new Date().toISOString(),
        pair: "EUR/USD",
        timeframe: "M15",
        type: "BUY",
        entry_price: 1.16540,
        sl: 1.16190,
        tp: 1.17240,
        confidence_score: 92,
        sentiment: "STRONG BULLISH",
        status: "ACTIVE",
        version: "AI AGENT V1.5",
        expiry_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        metadata: {
            backtest_ref: "5_year_matching_v1",
            volatility: "low",
            tp1_price: 1.17000,
            tp2_price: 1.17480
        }
    };

    dispatchSignal(testSignal)
        .then(() => console.log('Test signal dispatched successfully'))
        .catch(err => console.error('Test failed:', err));
}
