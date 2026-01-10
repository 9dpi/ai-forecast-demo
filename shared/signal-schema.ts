/**
 * Signal Genius AI - TypeScript Interface
 * Standard Signal Schema for Quantix AI Core ↔ MVP Communication
 * 
 * This interface ensures type safety across the distributed system.
 */

export interface SignalMetadata {
    backtest_ref?: string;
    volatility?: 'low' | 'medium' | 'high';
    risk_reward_ratio?: string;
    tp1_price?: number;
    tp2_price?: number;
}

export interface StandardSignal {
    signal_id: string; // UUID v4
    timestamp: string; // ISO 8601
    pair: string; // e.g., "EUR/USD"
    timeframe: 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1';
    type: 'BUY' | 'SELL';
    entry_price: number;
    sl: number;
    tp: number;
    confidence_score: number; // 0-100
    sentiment: 'STRONG BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG BEARISH';
    status: 'ACTIVE' | 'WAITING' | 'ENTRY_HIT' | 'TP1_HIT' | 'TP2_HIT' | 'SL_HIT' | 'EXPIRED';
    version: string; // e.g., "AI AGENT V1.5"
    expiry_time?: string; // ISO 8601
    metadata?: SignalMetadata;
}

/**
 * Example Signal Instance
 */
export const EXAMPLE_SIGNAL: StandardSignal = {
    signal_id: "550e8400-e29b-41d4-a716-446655440000",
    timestamp: "2026-01-11T17:05:00Z",
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
    expiry_time: "2026-01-11T21:05:00Z",
    metadata: {
        backtest_ref: "5_year_matching_v1",
        volatility: "low",
        risk_reward_ratio: "1:2.6",
        tp1_price: 1.17000,
        tp2_price: 1.17480
    }
};

/**
 * Validation Helper
 */
export function validateSignal(signal: any): signal is StandardSignal {
    return (
        typeof signal.signal_id === 'string' &&
        typeof signal.timestamp === 'string' &&
        typeof signal.pair === 'string' &&
        ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'].includes(signal.timeframe) &&
        ['BUY', 'SELL'].includes(signal.type) &&
        typeof signal.entry_price === 'number' &&
        typeof signal.sl === 'number' &&
        typeof signal.tp === 'number' &&
        typeof signal.confidence_score === 'number' &&
        signal.confidence_score >= 0 &&
        signal.confidence_score <= 100 &&
        ['STRONG BULLISH', 'BULLISH', 'NEUTRAL', 'BEARISH', 'STRONG BEARISH'].includes(signal.sentiment) &&
        ['ACTIVE', 'WAITING', 'ENTRY_HIT', 'TP1_HIT', 'TP2_HIT', 'SL_HIT', 'EXPIRED'].includes(signal.status) &&
        typeof signal.version === 'string'
    );
}
