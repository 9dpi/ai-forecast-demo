/**
 * QUANTIX CORE V1.8 - MULTI-AGENT INTEGRATION TESTS
 * Test Suite for Agent De-coupling Phase
 * 
 * Run: node tests/test-multi-agent.js
 */

import { technicalAgent } from '../backend/agents/tech_agent.js';
import { sentinelAgent } from '../backend/agents/sentinel_agent.js';
import { criticAgent } from '../backend/agents/critic_agent.js';
import { agentBus } from '../backend/agents/bus.js';

// Test utilities
const assert = (condition, message) => {
    if (!condition) {
        console.error(`❌ ASSERTION FAILED: ${message}`);
        process.exit(1);
    }
    console.log(`✅ ${message}`);
};

const testHeader = (title) => {
    console.log('\n' + '='.repeat(60));
    console.log(`  ${title}`);
    console.log('='.repeat(60) + '\n');
};

// Mock market data generator
const generateMockMarketData = (overrides = {}) => {
    const basePrice = 1.0500;
    const prices = Array.from({ length: 50 }, (_, i) =>
        basePrice + (Math.random() - 0.5) * 0.001
    );

    return {
        symbol: 'EURUSD=X',
        currentPrice: prices[prices.length - 1],
        prices,
        currentCandle: {
            open: basePrice,
            high: basePrice + 0.0005,
            low: basePrice - 0.0003,
            close: basePrice + 0.0002
        },
        volume: Array.from({ length: 50 }, () => 1000 + Math.random() * 500),
        direction: 'LONG',
        ...overrides
    };
};

// ============================================================================
// TEST 1: CONSENSUS TEST - Conflicting Signals
// ============================================================================
async function testConsensusLogic() {
    testHeader('TEST 1: CONSENSUS LOGIC - Conflicting Signals');

    console.log('📋 Scenario: Good technical setup BUT high-impact news pending');
    console.log('   Expected: Critic Agent must REJECT the signal\n');

    // Inject fake high-impact news
    sentinelAgent.injectEconomicEvent({
        title: 'US Non-Farm Payrolls (NFP)',
        timestamp: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min from now
        impact: 'HIGH',
        currency: 'USD'
    });

    // Create good technical data
    const mockData = generateMockMarketData({
        currentCandle: {
            open: 1.0500,
            high: 1.0505, // Small wick
            low: 1.0498,
            close: 1.0503
        }
    });

    // Get votes from both agents
    const techVote = await technicalAgent.analyze(mockData);
    const sentinelVote = await sentinelAgent.analyze(mockData);

    console.log(`\n📊 Technical Agent Vote: ${techVote.decision} (Score: ${techVote.technicalScore})`);
    console.log(`📊 Sentinel Agent Vote: ${sentinelVote.decision} (Sentiment: ${sentinelVote.sentimentScore})`);

    // Critic makes final decision
    const finalDecision = await criticAgent.decide([techVote, sentinelVote]);

    console.log(`\n🎯 Critic Final Decision: ${finalDecision.decision}`);
    console.log(`   Reason: ${finalDecision.reason || finalDecision.reasoning}`);

    // Assertions
    assert(
        finalDecision.decision === 'REJECT',
        'Critic must REJECT when Sentinel detects high-impact news'
    );

    console.log('\n✅ TEST 1 PASSED: Consensus logic working correctly\n');
}

// ============================================================================
// TEST 2: ANTI-WICK FAKEOUT DETECTION
// ============================================================================
async function testAntiWickDetection() {
    testHeader('TEST 2: ANTI-WICK FAKEOUT DETECTION');

    console.log('📋 Scenario: Candle with long wick (potential fakeout)');
    console.log('   Expected: Technical Agent must REJECT\n');

    const mockData = generateMockMarketData({
        currentCandle: {
            open: 1.0500,
            high: 1.0550, // Huge upper wick
            low: 1.0495,
            close: 1.0505  // Small body
        }
    });

    const techVote = await technicalAgent.analyze(mockData);

    console.log(`\n📊 Technical Agent Decision: ${techVote.decision}`);
    console.log(`   Wick Ratio: ${techVote.details?.wickRatio || 'N/A'}`);
    console.log(`   Reasoning: ${techVote.reasoning}`);

    // Assertions
    assert(
        techVote.decision === 'REJECT',
        'Technical Agent must REJECT signals with high wick ratio (fakeout)'
    );

    console.log('\n✅ TEST 2 PASSED: Anti-wick detection working\n');
}

// ============================================================================
// TEST 3: LATENCY STRESS TEST
// ============================================================================
async function testLatencyStress() {
    testHeader('TEST 3: LATENCY STRESS TEST');

    console.log('📋 Scenario: Run all 3 agents in parallel under load');
    console.log('   Expected: Total decision time < 500ms\n');

    const mockData = generateMockMarketData();

    const startTime = Date.now();

    // Run Tech and Sentinel in parallel
    const [techVote, sentinelVote] = await Promise.all([
        technicalAgent.analyze(mockData),
        sentinelAgent.analyze(mockData)
    ]);

    // Critic makes final decision
    const finalDecision = await criticAgent.decide([techVote, sentinelVote]);

    const totalTime = Date.now() - startTime;

    console.log(`\n⏱️  Total Processing Time: ${totalTime}ms`);
    console.log(`   Tech Agent: ${techVote.details?.processingTime || 'N/A'}`);
    console.log(`   Sentinel Agent: ${sentinelVote.details?.processingTime || 'N/A'}`);
    console.log(`   Critic Agent: ${finalDecision.details?.processingTime || 'N/A'}`);

    // Assertions
    assert(
        totalTime < 500,
        `Total decision time (${totalTime}ms) must be < 500ms`
    );

    console.log('\n✅ TEST 3 PASSED: Latency requirements met\n');
}

// ============================================================================
// TEST 4: SUCCESSFUL CONSENSUS (HAPPY PATH)
// ============================================================================
async function testSuccessfulConsensus() {
    testHeader('TEST 4: SUCCESSFUL CONSENSUS - Happy Path');

    console.log('📋 Scenario: Good technical setup + Positive sentiment');
    console.log('   Expected: Both agents APPROVE, Critic APPROVES\n');

    // Clear any injected news
    sentinelAgent.economicCalendar = [];
    sentinelAgent.newsCache = [];

    // Inject positive news
    sentinelAgent.injectNews({
        title: 'EUR Economy Shows Strong Growth',
        sentiment: 0.8
    });

    const mockData = generateMockMarketData({
        currentCandle: {
            open: 1.0500,
            high: 1.0508, // Moderate upper wick
            low: 1.0497,  // Moderate lower wick
            close: 1.0506  // Good body size
        }
    });

    const techVote = await technicalAgent.analyze(mockData);
    const sentinelVote = await sentinelAgent.analyze(mockData);
    const finalDecision = await criticAgent.decide([techVote, sentinelVote]);

    console.log(`\n📊 Technical Agent: ${techVote.decision} (Score: ${techVote.technicalScore})`);
    console.log(`📊 Sentinel Agent: ${sentinelVote.decision} (Sentiment: ${sentinelVote.sentimentScore})`);
    console.log(`🎯 Critic Decision: ${finalDecision.decision} (Confidence: ${finalDecision.compositeConfidence}%)`);

    // Assertions
    assert(
        techVote.decision === 'APPROVE',
        'Technical Agent should APPROVE good setup'
    );
    assert(
        sentinelVote.decision === 'APPROVE',
        'Sentinel Agent should APPROVE with positive sentiment'
    );
    assert(
        finalDecision.decision === 'APPROVE',
        'Critic should APPROVE when both agents agree'
    );
    assert(
        finalDecision.compositeConfidence >= 70,
        `Composite confidence (${finalDecision.compositeConfidence}%) should be >= 70%`
    );

    console.log('\n✅ TEST 4 PASSED: Successful consensus achieved\n');
}

// ============================================================================
// TEST 5: AGENT BUS COMMUNICATION
// ============================================================================
async function testAgentBusCommunication() {
    testHeader('TEST 5: AGENT BUS COMMUNICATION');

    console.log('📋 Scenario: Test message passing between agents');
    console.log('   Expected: Messages delivered with low latency\n');

    let messageReceived = false;
    let receivedData = null;

    // Subscribe to test channel
    agentBus.subscribe('test_channel', (message) => {
        messageReceived = true;
        receivedData = message.data;
    });

    // Publish test message
    const testData = { test: 'Hello from Agent Bus', timestamp: Date.now() };
    agentBus.publish('test_channel', testData);

    // Wait a bit for async delivery
    await new Promise(resolve => setTimeout(resolve, 50));

    // Get bus stats
    const stats = agentBus.getStats();

    console.log(`\n📊 Bus Statistics:`);
    console.log(`   Total Messages: ${stats.totalMessages}`);
    console.log(`   Avg Latency: ${stats.avgLatency.toFixed(2)}ms`);
    console.log(`   Active Channels: ${stats.activeChannels}`);

    // Assertions
    assert(messageReceived, 'Message should be received');
    assert(receivedData.test === testData.test, 'Message data should match');
    assert(stats.avgLatency < 10, `Avg latency (${stats.avgLatency.toFixed(2)}ms) should be < 10ms`);

    console.log('\n✅ TEST 5 PASSED: Agent Bus communication working\n');
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
async function runAllTests() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   QUANTIX V1.8 - MULTI-AGENT INTEGRATION TEST SUITE       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    try {
        await testAgentBusCommunication();
        await testAntiWickDetection();
        await testConsensusLogic();
        await testSuccessfulConsensus();
        await testLatencyStress();

        console.log('\n' + '='.repeat(60));
        console.log('🎉 ALL TESTS PASSED! Multi-Agent System is operational.');
        console.log('='.repeat(60) + '\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ TEST SUITE FAILED:', error);
        process.exit(1);
    }
}

// Run tests
runAllTests();
