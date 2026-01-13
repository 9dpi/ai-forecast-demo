import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

import dns from 'node:dns';
if (dns.setDefaultResultOrder) dns.setDefaultResultOrder('ipv4first');

import dotenv from 'dotenv';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { analyzeSignalWithAgents } from './signal_genius_core_v1.8.js';
import { broadcastGoldenSignal } from './telegram_autopilot.js';

dotenv.config();

// Initialize Supabase for SSOT
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// --- CONFIGURATION ---
const ASSETS = ['EURUSD=X'];
const SCAN_INTERVAL = 30000; // 30 seconds for Demo

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: { rejectUnauthorized: false }
});

/**
 * BACKUP API: 3rd Level Fallback (Completely Free, No Key needed for Basic EURUSD)
 */
async function fetchFromBackupAPI(symbol) {
    if (symbol !== 'EURUSD=X') return null;
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
        const data = await response.json();
        if (data && data.rates && data.rates.USD) {
            const price = data.rates.USD;
            console.log(`📡 [${symbol}] 3rd-Party Backup API Success: $${price}`);
            return {
                symbol: symbol,
                currentPrice: price,
                prices: new Array(50).fill(price), // Mock history for agents
                volume: new Array(50).fill(1000000),
                dataQuality: 'DEGRADED',
                metadata: { candleCount: 1, momentum: 0 }
            };
        }
    } catch (e) {
        return null;
    }
    return null;
}

/**
 * FALLBACK ENGINE: Fetch data from Alpha Vantage when Yahoo fails
 */
async function fetchFromAlphaVantage(symbol) {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY || process.env.ALPHA_VANTAGE_KEY;
    if (!apiKey) {
        console.warn(`[${symbol}] Alpha Vantage Key MISSING! (Using Fallbacks)`);
        return null;
    }

    try {
        // Map symbol to AV format
        let avSymbol = symbol.replace('=X', '');
        let functionName = 'FX_INTRADAY';
        let interval = '1min'; // 🔥 CRITICAL: 1min for real-time movement during demo

        let url = '';
        if (symbol.includes('BTC')) {
            functionName = 'DIGITAL_CURRENCY_DAILY';
            avSymbol = 'BTC';
            url = `https://www.alphavantage.co/query?function=${functionName}&symbol=${avSymbol}&market=USD&apikey=${apiKey}`;
        } else {
            const base = avSymbol.substring(0, 3);
            const quote = avSymbol.substring(3, 6);
            url = `https://www.alphavantage.co/query?function=${functionName}&from_symbol=${base}&to_symbol=${quote}&interval=${interval}&apikey=${apiKey}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        // Detect API Limit or Premium Error
        if (data['Note'] || data['Information']) {
            console.warn(`[${symbol}] AV_LIMIT reached.`);
            return null;
        }

        const timeSeriesKey = Object.keys(data).find(k => k.includes('Time Series') || k.includes('FX Intraday'));
        if (!timeSeriesKey) return null;

        const timeSeries = data[timeSeriesKey];
        const dates = Object.keys(timeSeries).slice(0, 50);
        const prices = dates.map(d => parseFloat(timeSeries[d]['4. close'] || timeSeries[d]['4a. close (USD)']));

        console.log(`📡 [${symbol}] Alpha Vantage Success: $${prices[0]}`);

        return {
            symbol: symbol,
            currentPrice: prices[0],
            prices: prices.reverse(),
            volume: dates.map(d => parseFloat(timeSeries[d]['5. volume'] || 0)),
            dataQuality: 'GOOD',
            metadata: {
                candleCount: prices.length,
                momentum: (prices[prices.length - 1] - prices[0]) / prices[0]
            }
        };
    } catch (e) {
        console.error(`🚨 [${symbol}] Alpha Vantage Error:`, e.message);
        return null;
    }
}

/**
 * v1.9.9 BATTLE-READY: AV + Yahoo + BackupAPI + Simulated Fallback
 */
async function fetchInstitutionalData(symbol) {
    console.log(`📡 [${symbol}] Primary Engine: Attempting Alpha Vantage...`);
    let data = await fetchFromAlphaVantage(symbol);

    if (!data) {
        console.warn(`⚠️ [${symbol}] Alpha Vantage failed. Falling back to Yahoo with 5s timeout...`);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const result = await yahooFinance.chart(symbol, {
                period1: '1d',
                interval: '1h'
            }, { signal: controller.signal });

            clearTimeout(timeoutId);

            if (result && result.quotes && result.quotes.length > 0) {
                const quotes = result.quotes.filter(q => q.close !== null);
                const latest = quotes[quotes.length - 1];
                console.log(`✅ [${symbol}] Yahoo Success: $${latest.close}`);
                data = {
                    symbol: symbol,
                    currentPrice: latest.close,
                    prices: quotes.map(q => q.close),
                    volume: quotes.map(q => q.volume || 0),
                    dataQuality: 'DEGRADED',
                    metadata: {
                        candleCount: quotes.length,
                        momentum: (latest.close - quotes[0].close) / quotes[0].close
                    }
                };
            }
        } catch (err) {
            console.error(`🚨 [${symbol}] Yahoo API Failure: ${err.message}`);
        }
    }

    // 3. 3RD LEVEL FALLBACK: Public Backup API
    if (!data) {
        console.log(`🚨 [${symbol}] All primary engines failed. Trying Backup API...`);
        data = await fetchFromBackupAPI(symbol);
    }

    // 🚑 FINAL EMERGENCY: Simulated Price Pulse
    if (!data) {
        console.log(`🏥 [${symbol}] EMERGENCY: Activating Simulated Pulse...`);
        try {
            const { data: lastRecord } = await supabase.from('market_snapshot').select('price').eq('symbol', symbol).single();
            const lastPrice = lastRecord?.price || 1.16577;
            const wiggle = (Math.random() - 0.5) * 0.00005;
            const simulatedPrice = lastPrice + wiggle;

            data = {
                symbol: symbol,
                currentPrice: simulatedPrice,
                prices: new Array(50).fill(simulatedPrice),
                volume: new Array(50).fill(0),
                dataQuality: 'DEGRADED',
                metadata: { candleCount: 50, momentum: 0, isSimulated: true }
            };
        } catch (e) {
            return null;
        }
    }

    return data;
}

/**
 * Handle saving signals to DB with quality check
 */
async function saveSignalToDB(signal) {
    try {
        const { error } = await supabase
            .from('ai_signals')
            .insert([{
                symbol: signal.symbol,
                action: signal.action,
                entry_price: signal.entry_price,
                tp: signal.tp,
                sl: signal.sl,
                confidence: signal.confidence,
                ai_status: signal.ai_status,
                metadata: signal.metadata,
                timestamp: new Date().toISOString()
            }]);

        if (error) throw error;
        console.log(`✅ [DB] Signal saved for ${signal.symbol}`);
    } catch (e) {
        console.error('❌ [DB SAVE ERROR]', e);
    }
}

/**
 * Update the SSOT (Single Source of Truth) in Supabase
 */
async function updateSSOT(symbol, marketData, decision) {
    try {
        const payload = {
            symbol: symbol,
            price: marketData.currentPrice,
            ai_status: decision.action === 'WAVE_SYNC' ? 'NEUTRAL' : decision.action,
            confidence_score: decision.confidence,
            last_candle_data: {
                prices: marketData.prices.slice(-4),
                volume: marketData.volume.slice(-1)[0]
            },
            data_quality: marketData.dataQuality || 'GOOD',
            last_updated: new Date().toISOString()
        };

        const { error } = await supabase
            .from('market_snapshot')
            .upsert(payload, { onConflict: 'symbol' });

        if (error) throw error;
        console.log(`🔄 [SSOT] Synced ${symbol} @ ${marketData.currentPrice.toFixed(5)} [${payload.ai_status}]`);
    } catch (e) {
        console.error('❌ [SSOT SYNC ERROR]', e);
    }
}

async function scanAll() {
    console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Analysis Cycle Starting...`);

    for (const symbol of ASSETS) {
        const marketData = await fetchInstitutionalData(symbol);
        if (!marketData) continue;

        // 🔥 CRITICAL FIX: Update SSOT price IMMEDIATELY after fetch (Latency Killer)
        console.log(`⚡ [SSOT_FAST_TRACK] Updating price for ${symbol}...`);
        await updateSSOT(symbol, marketData, { action: 'WAVE_SYNC', confidence: 0 });

        // Perform Multi-Agent Analysis (Can take time)
        const decision = await analyzeSignalWithAgents(marketData);

        // Update SSOT again with AI Decision result
        await updateSSOT(symbol, marketData, decision);

        if (decision.shouldEmitSignal || decision.isGhostSignal) {
            const signalBody = {
                symbol,
                action: decision.action,
                entry_price: marketData.currentPrice,
                tp: decision.tp,
                sl: decision.sl,
                confidence: decision.confidence,
                ai_status: decision.action,
                metadata: {
                    agents: decision.agents,
                    market_state: decision.market_state
                }
            };

            await saveSignalToDB(signalBody);

            if (decision.shouldEmitSignal) {
                await broadcastGoldenSignal(signalBody);
            }
        }
    }
}

async function runScanner() {
    console.log('\n🚀 Institutional AI Scanner v1.9.9 - IMMORTAL MODE');
    console.log(`📡 Monitoring: ${ASSETS.join(', ')}`);
    console.log(`⏱️  Interval: ${SCAN_INTERVAL / 1000}s`);
    console.log('🔥 SSOT: Multi-Level Fallback + Simulated Pulse Active\n');

    // Run first scan immediately
    await scanAll();

    // Set interval for subsequent scans
    setInterval(scanAll, SCAN_INTERVAL);
}

// Global error handler
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err);
});

runScanner();
