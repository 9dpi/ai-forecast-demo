import dotenv from 'dotenv';
dotenv.config();

/**
 * Test script for entry_price fallback mechanism
 * Simulates a signal with missing entry_price to verify Yahoo Finance fallback
 */

const INTERNAL_AUTH_KEY = process.env.INTERNAL_AUTH_KEY;
const API_URL = 'http://localhost:5173/api/v1/internal/signals';

async function testFallbackMechanism() {
    console.log('🧪 Testing Entry Price Fallback Mechanism...\n');

    // Test Case 1: Signal with valid entry_price
    const validSignal = {
        signal_id: `TEST_VALID_${Date.now()}`,
        pair: 'EUR/USD',
        type: 'BUY',
        entry_price: 1.0950,
        sl: 1.0900,
        tp: 1.1000,
        confidence_score: 85,
        timestamp: new Date().toISOString(),
        version: 'V1.9_TEST'
    };

    // Test Case 2: Signal with NULL entry_price (should trigger fallback)
    const nullSignal = {
        signal_id: `TEST_NULL_${Date.now()}`,
        pair: 'EUR/USD',
        type: 'LONG',
        entry_price: null,
        sl: 1.0900,
        tp: 1.1000,
        confidence_score: 90,
        timestamp: new Date().toISOString(),
        version: 'V1.9_TEST_FALLBACK'
    };

    // Test Case 3: Signal with missing entry_price field
    const missingSignal = {
        signal_id: `TEST_MISSING_${Date.now()}`,
        pair: 'EUR/USD',
        type: 'SHORT',
        sl: 1.0900,
        tp: 1.1000,
        confidence_score: 88,
        timestamp: new Date().toISOString(),
        version: 'V1.9_TEST_MISSING'
    };

    const testCases = [
        { name: 'Valid Entry Price', signal: validSignal },
        { name: 'NULL Entry Price (Fallback)', signal: nullSignal },
        { name: 'Missing Entry Price (Fallback)', signal: missingSignal }
    ];

    for (const testCase of testCases) {
        console.log(`\n📝 Test: ${testCase.name}`);
        console.log(`   Signal ID: ${testCase.signal.signal_id}`);
        console.log(`   Entry Price: ${testCase.signal.entry_price ?? 'MISSING'}`);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': INTERNAL_AUTH_KEY
                },
                body: JSON.stringify(testCase.signal)
            });

            const result = await response.json();

            if (response.ok) {
                console.log(`   ✅ SUCCESS: ${result.message}`);
                console.log(`   Stored at: ${result.stored_at}`);
            } else {
                console.log(`   ❌ FAILED: ${result.error}`);
                if (result.message) console.log(`   Message: ${result.message}`);
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }
    }

    console.log('\n✅ Fallback Mechanism Test Complete!');
}

testFallbackMechanism();
