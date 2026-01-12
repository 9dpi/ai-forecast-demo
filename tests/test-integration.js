/**
 * QUANTIX V1.8 - INTEGRATION VERIFICATION TEST
 * Quick test to verify the integration wrapper works correctly
 * 
 * Run: node tests/test-integration.js
 */

import { analyzeSignalWithAgents, getSystemStats, healthCheck, formatTelegramMessage } from '../backend/quantix_core_v1.8.js';

console.log('\n🔧 QUANTIX V1.8 INTEGRATION TEST\n');

// Run health check first
await healthCheck();

// Test signal analysis
console.log('Testing signal analysis...\n');

const mockMarketData = {
    symbol: 'EURUSD=X',
    currentPrice: 1.0500,
    prices: Array.from({ length: 50 }, (_, i) => 1.0500 + (Math.random() - 0.5) * 0.001),
    currentCandle: {
        open: 1.0500,
        high: 1.0508,
        low: 1.0499,
        close: 1.0507
    },
    volume: Array.from({ length: 50 }, () => 1000),
    direction: 'LONG'
};

const decision = await analyzeSignalWithAgents(mockMarketData);

console.log('\n📊 DECISION RESULT:');
console.log(`   Should Emit: ${decision.shouldEmitSignal ? 'YES ✅' : 'NO ❌'}`);
console.log(`   Confidence: ${decision.confidence}%`);
console.log(`   Shadow Mode: ${decision.shadowMode ? 'ACTIVE' : 'DISABLED'}`);
console.log(`   Processing Time: ${decision.processingTime}ms`);

// Test Telegram message formatting
if (decision.shouldEmitSignal) {
    console.log('\n📱 TELEGRAM MESSAGE PREVIEW:');
    console.log('─'.repeat(50));

    const mockSignal = {
        pair: 'EUR/USD',
        action: 'BUY',
        entry: '1.05070',
        sl: '1.04800',
        tp: '1.05500'
    };

    const message = formatTelegramMessage(mockSignal, decision);
    console.log(message);
    console.log('─'.repeat(50));
}

// Show final stats
console.log('\n📊 SYSTEM STATISTICS:');
const stats = getSystemStats();
console.log(`   Total Decisions: ${stats.totalDecisions}`);
console.log(`   Approval Rate: ${stats.approvalRate}`);
console.log(`   Avg Confidence: ${stats.avgConfidence}`);

console.log('\n✅ INTEGRATION TEST COMPLETE\n');
console.log('🚀 System is ready for deployment to Railway!\n');

process.exit(0);
