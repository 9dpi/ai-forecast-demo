/**
 * Unit Test: Yahoo Finance Fallback Mechanism
 * Tests the fallback logic without requiring API server
 */

async function testYahooFallback() {
    console.log('🧪 Testing Yahoo Finance Fallback Logic...\n');

    const testPair = 'EUR/USD';
    const yahooSymbol = testPair.replace('/', '') + '=X';

    console.log(`📊 Fetching current price for ${testPair} (${yahooSymbol})...`);

    try {
        const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        console.log('\n📦 API Response Structure:');
        console.log(`   - chart.result exists: ${!!data?.chart?.result}`);
        console.log(`   - result[0] exists: ${!!data?.chart?.result?.[0]}`);
        console.log(`   - meta exists: ${!!data?.chart?.result?.[0]?.meta}`);

        if (data?.chart?.result?.[0]?.meta?.regularMarketPrice) {
            const price = data.chart.result[0].meta.regularMarketPrice;
            console.log(`\n✅ SUCCESS: Fallback price fetched: ${price}`);
            console.log(`   Currency: ${data.chart.result[0].meta.currency}`);
            console.log(`   Exchange: ${data.chart.result[0].meta.exchangeName}`);
            console.log(`   Market State: ${data.chart.result[0].meta.marketState}`);

            // Simulate the fallback logic
            console.log('\n🔄 Simulating Fallback Mechanism:');
            console.log(`   Original entry_price: null`);
            console.log(`   Fallback entry_price: ${price}`);
            console.log(`   ✅ Signal would be ACCEPTED with fallback price`);

            return { success: true, price };
        } else {
            console.log('\n❌ FAILED: regularMarketPrice not found in response');
            console.log('   Signal would be REJECTED');
            return { success: false, error: 'Price not found' };
        }

    } catch (error) {
        console.error(`\n❌ Fallback fetch error: ${error.message}`);
        console.log('   Signal would be REJECTED');
        return { success: false, error: error.message };
    }
}

// Test multiple pairs
async function runFullTest() {
    const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY'];

    console.log('🚀 Running Full Fallback Test Suite\n');
    console.log('='.repeat(60));

    for (const pair of pairs) {
        console.log(`\n\n📌 Testing: ${pair}`);
        console.log('-'.repeat(60));

        const yahooSymbol = pair.replace('/', '') + '=X';

        try {
            const response = await fetch(
                `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`
            );
            const data = await response.json();

            if (data?.chart?.result?.[0]?.meta?.regularMarketPrice) {
                const price = data.chart.result[0].meta.regularMarketPrice;
                console.log(`✅ ${pair}: ${price} (${data.chart.result[0].meta.currency})`);
            } else {
                console.log(`❌ ${pair}: Price not available`);
            }
        } catch (error) {
            console.log(`❌ ${pair}: ${error.message}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Full Test Suite Complete!\n');
}

// Run the test
runFullTest();
