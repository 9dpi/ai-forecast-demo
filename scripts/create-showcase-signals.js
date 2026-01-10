import { dispatchSignal } from '../backend/dispatcher/signal-dispatcher.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create Showcase Signals for Irfan Demo
 * These are high-quality, visually impressive signals to demonstrate the system
 */

async function createShowcaseSignals() {
    console.log('🎨 Creating showcase signals for Irfan demo...\n');

    // Signal 1: High Confidence BUY (94%)
    const signal1 = {
        signal_id: uuidv4(),
        timestamp: new Date().toISOString(),
        pair: "EUR/USD",
        timeframe: "M15",
        type: "BUY",
        entry_price: 1.16540,
        sl: 1.16190,
        tp: 1.17240,
        confidence_score: 94,
        sentiment: "STRONG BULLISH",
        status: "WAITING",
        version: "AI AGENT V1.5",
        expiry_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        metadata: {
            backtest_ref: "5_year_matching_v1",
            volatility: "low",
            risk_reward_ratio: "1:3.0",
            tp1_price: 1.17000,
            tp2_price: 1.17480
        }
    };

    // Signal 2: Very High Confidence SELL (96%)
    const signal2 = {
        signal_id: uuidv4(),
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
        pair: "EUR/USD",
        timeframe: "M15",
        type: "SELL",
        entry_price: 1.16390,
        sl: 1.16740,
        tp: 1.15690,
        confidence_score: 96,
        sentiment: "STRONG BEARISH",
        status: "ENTRY_HIT",
        version: "AI AGENT V1.5",
        expiry_time: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(),
        metadata: {
            backtest_ref: "5_year_matching_v1",
            volatility: "low",
            risk_reward_ratio: "1:2.8",
            tp1_price: 1.16040,
            tp2_price: 1.15690
        }
    };

    try {
        console.log('📤 Dispatching Signal 1: EUR/USD BUY (94% confidence)...');
        const result1 = await dispatchSignal(signal1);
        console.log('✅ Signal 1 created:', result1.signal_id);
        console.log('   Entry: 1.16540 | SL: 1.16190 | TP: 1.17240\n');

        // Wait 2 seconds between signals
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('📤 Dispatching Signal 2: EUR/USD SELL (96% confidence - ENTRY HIT)...');
        const result2 = await dispatchSignal(signal2);
        console.log('✅ Signal 2 created:', result2.signal_id);
        console.log('   Entry: 1.16390 | SL: 1.16740 | TP: 1.15690\n');

        console.log('🎉 Showcase signals created successfully!');
        console.log('\n📱 Irfan can now view them at:');
        console.log('   https://9dpi.github.io/ai-forecast-demo/#/mvp');
        console.log('\n💡 Features to showcase:');
        console.log('   ✨ Gold AI Score Cards (94% & 96%)');
        console.log('   ⚡ Full-width BUY/SELL badges with Zap icons');
        console.log('   🟢 Green pulsing dot (WAITING status)');
        console.log('   🟡 Yellow steady dot (ENTRY_HIT status)');
        console.log('   🎨 Beautiful Bento Card layout');
        console.log('   🌓 Dark/Light theme toggle');

    } catch (error) {
        console.error('❌ Error creating showcase signals:', error.message);
    }
}

// Run the showcase
createShowcaseSignals();
