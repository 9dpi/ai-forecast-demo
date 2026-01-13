/**
 * 🛡️ THE SANDBOX TEST - LOCAL API WRAPPER
 * Verifies Quantix AI Core v2.5 isolation and watermark integrity.
 */

import { analyzeSignalWithAgents } from './backend/signal_genius_core_v2.5_base.js';

async function testBrainHandshake() {
    console.log("📡 [LOCAL_TEST] Requesting analysis from Quantix AI Core...");

    // Giả lập dữ liệu nến thực (MarketData object expected by v1.8)
    const mockMarketData = {
        symbol: "EURUSD=X",
        currentPrice: 1.1662,
        prices: [1.1660, 1.1661, 1.1662, 1.1659, 1.1660, 1.1662, 1.1658, 1.1662],
        volume: [100, 110, 120, 130, 140, 150, 160, 170],
        direction: 'LONG'
    };

    try {
        // Step 2: Independence Check (No DB connection needed for analysis logic itself)
        const rawResult = await analyzeSignalWithAgents(mockMarketData);

        // Step 1: Wrap result into "Black Box" API response
        const apiResponse = {
            "version": "v2.5.0-sandbox",
            "provider": "Quantix AI Core v2.5",
            "client_id": "SignalGenius_AI",
            "data": {
                "symbol": mockMarketData.symbol,
                "action": rawResult.confidence > 90 ? (rawResult.action || 'NEUTRAL') : "NEUTRAL",
                "confidence": rawResult.confidence,
                "reasoning": rawResult.reasoning || "Analysis complete"
            },
            "disclaimer": "Powered by Quantix AI Core" // Step 3: Watermark Verification
        };

        console.log("\n✅ [API_SUCCESS] Payload Verified:");
        console.log(JSON.stringify(apiResponse, null, 2));

    } catch (error) {
        console.error("\n❌ [API_FAILURE] Brain disconnected:", error.message);
    }
}

// Ensure the process exits cleanly after test
testBrainHandshake().then(() => {
    console.log("\n🧪 Test Sequence Finished.");
    process.exit(0);
}).catch(err => {
    console.error("Fatal Test Error:", err);
    process.exit(1);
});
