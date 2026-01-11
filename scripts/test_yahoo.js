import yahooFinance from 'yahoo-finance2';

// yahoo-finance2 v2+ uses a singleton or you can create one.
// Let's try the singleton approach or check documentation by trial.
// In v3+, you might need to use yahooFinance._env if needed, but chart() should work if imported correctly.

async function test() {
    try {
        const queryOptions = { period1: '2025-01-01', period2: '2025-12-31', interval: '1h' };
        const result = await yahooFinance.chart('EURUSD=X', queryOptions);
        console.log(`Fetched ${result.quotes.length} candles from Yahoo Finance`);
        console.log(result.quotes[0]);
    } catch (error) {
        console.error("Yahoo Error:", error.message);
        // Fallback: try to see if it's a different export
        console.log("Keys in yahooFinance:", Object.keys(yahooFinance || {}));
    }
}

test();
