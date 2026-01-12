/**
 * QUANTIX CORE V1.8 - AGENT COMMUNICATION BUS
 * High-performance Event Emitter for inter-agent communication
 * Target Latency: < 50ms per message
 */

import { EventEmitter } from 'events';

class AgentBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(20); // Support multiple agents
        this.messageLog = [];
        this.metrics = {
            totalMessages: 0,
            avgLatency: 0,
            lastMessageTime: null
        };
    }

    /**
     * Publish message to a channel with latency tracking
     */
    publish(channel, data) {
        const startTime = Date.now();

        const message = {
            channel,
            data,
            timestamp: new Date().toISOString(),
            messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        this.emit(channel, message);

        const latency = Date.now() - startTime;
        this._updateMetrics(latency);
        this._logMessage(message, latency);

        return message.messageId;
    }

    /**
     * Subscribe to a channel
     */
    subscribe(channel, callback) {
        this.on(channel, callback);
        console.log(`[BUS] Agent subscribed to channel: ${channel}`);
    }

    /**
     * Unsubscribe from a channel
     */
    unsubscribe(channel, callback) {
        this.off(channel, callback);
    }

    /**
     * Request-Response pattern for synchronous communication
     */
    async request(channel, data, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const responseChannel = `${channel}_response_${Date.now()}`;
            const timeoutId = setTimeout(() => {
                this.unsubscribe(responseChannel, responseHandler);
                reject(new Error(`Request timeout on channel: ${channel}`));
            }, timeout);

            const responseHandler = (message) => {
                clearTimeout(timeoutId);
                this.unsubscribe(responseChannel, responseHandler);
                resolve(message.data);
            };

            this.subscribe(responseChannel, responseHandler);
            this.publish(channel, { ...data, responseChannel });
        });
    }

    /**
     * Get bus statistics
     */
    getStats() {
        return {
            ...this.metrics,
            activeChannels: this.eventNames().length,
            recentMessages: this.messageLog.slice(-10)
        };
    }

    /**
     * Clear message log (for memory management)
     */
    clearLog() {
        this.messageLog = [];
    }

    // Private methods
    _updateMetrics(latency) {
        this.metrics.totalMessages++;
        this.metrics.avgLatency =
            (this.metrics.avgLatency * (this.metrics.totalMessages - 1) + latency) /
            this.metrics.totalMessages;
        this.metrics.lastMessageTime = new Date().toISOString();
    }

    _logMessage(message, latency) {
        this.messageLog.push({
            ...message,
            latency: `${latency}ms`
        });

        // Keep only last 100 messages
        if (this.messageLog.length > 100) {
            this.messageLog.shift();
        }
    }
}

// Singleton instance
export const agentBus = new AgentBus();

// Channel constants
export const CHANNELS = {
    MARKET_DATA: 'market_data',
    TECH_ANALYSIS: 'tech_analysis',
    SENTIMENT_CHECK: 'sentiment_check',
    CONSENSUS_REQUEST: 'consensus_request',
    SIGNAL_APPROVED: 'signal_approved',
    SIGNAL_REJECTED: 'signal_rejected',
    LEARNING_FEEDBACK: 'learning_feedback'
};

console.log('[BUS] Agent Communication Bus initialized ✅');
