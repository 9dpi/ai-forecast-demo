/**
 * QUANTIX V1.8 - ORCHESTRATOR SHADOW MODE TEST
 * Simplified test to verify Shadow Mode is working correctly
 * 
 * Run: node tests/test-shadow-mode.js
 */

import { orchestrator } from '../backend/agents/orchestrator.js';
import { sentinelAgent } from '../backend/agents/sentinel_agent.js';

console.log('\n🛡️  SHADOW MODE VERIFICATION TEST\n');
console.log('Testing that Orchestrator correctly filters signals by confidence...\n');

// Generate mock market data
const mockData = {
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

// Clear any existing news
sentinelAgent.economicCalendar = [];
sentinelAgent.newsCache = [];

// Test 1: Medium confidence signal (should be blocked)
console.log('TEST 1: Medium Confidence Signal');
console.log('─'.repeat(50));

const result1 = await orchestrator.analyzeAndDecide(mockData);

console.log(`\nResult:`);
console.log(`  Confidence: ${result1.confidence}%`);
console.log(`  Shadow Mode Active: ${result1.shadowMode}`);
console.log(`  Signal Emitted: ${result1.shouldEmitSignal ? 'YES ✅' : 'NO ❌'}`);

if (result1.confidence < 85 && !result1.shouldEmitSignal) {
    console.log(`\n✅ PASS: Shadow Mode correctly blocked signal (${result1.confidence}% < 85%)\n`);
} else {
    console.log(`\n❌ FAIL: Expected signal to be blocked\n`);
    process.exit(1);
}

// Test 2: Disable Shadow Mode
console.log('TEST 2: Shadow Mode Disabled');
console.log('─'.repeat(50));

orchestrator.disableShadowMode();

const result2 = await orchestrator.analyzeAndDecide(mockData);

console.log(`\nResult:`);
console.log(`  Confidence: ${result2.confidence}%`);
console.log(`  Shadow Mode Active: ${result2.shadowMode}`);
console.log(`  Signal Emitted: ${result2.shouldEmitSignal ? 'YES ✅' : 'NO ❌'}`);

if (!result2.shadowMode && result2.shouldEmitSignal && result2.confidence >= 60) {
    console.log(`\n✅ PASS: Signal emitted when Shadow Mode disabled (${result2.confidence}% >= 60%)\n`);
} else {
    console.log(`\n❌ FAIL: Expected signal to be emitted\n`);
    console.log(`  Debug: shadowMode=${result2.shadowMode}, shouldEmit=${result2.shouldEmitSignal}, confidence=${result2.confidence}%\n`);
    process.exit(1);
}

// Print statistics
console.log('ORCHESTRATOR STATISTICS');
console.log('─'.repeat(50));
const stats = orchestrator.getStats();
console.log(`Total Decisions: ${stats.totalDecisions}`);
console.log(`Approved Signals: ${stats.approvedSignals}`);
console.log(`Rejected Signals: ${stats.rejectedSignals}`);
console.log(`Approval Rate: ${stats.approvalRate}`);
console.log(`Avg Confidence: ${stats.avgConfidence}`);

console.log('\n🎉 ALL TESTS PASSED! Shadow Mode is operational.\n');
process.exit(0);
