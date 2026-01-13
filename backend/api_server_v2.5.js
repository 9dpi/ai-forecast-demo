import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { analyzeSignalWithAgents } from './signal_genius_core_v2.5_base.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 🛡️ API SECURITY MIDDLEWARE
const validateClient = (req, res, next) => {
    const clientKey = req.headers['x-client-key'] || req.body.client_key;
    const SECRET_KEY = process.env.SIGNALGENIUS_API_KEY;

    if (!clientKey || clientKey !== SECRET_KEY) {
        console.warn(`[SECURITY] Unauthorized access attempt from ${req.ip}`);
        return res.status(401).json({
            provider: "Quantix AI Core v2.5",
            error: "Unauthorized: Invalid or missing SignalGenius API Key",
            disclaimer: "Powered by Quantix AI Core"
        });
    }
    next();
};

/**
 * 🎯 SNIPER API ENDPOINT
 * Primary portal for SignalGenius_AI to request elite signals
 */
app.post('/api/v2/get-sniper-signal', validateClient, async (req, res) => {
    const { symbol, currentPrice, prices, volume, direction } = req.body;

    if (!symbol || !prices || !Array.isArray(prices)) {
        return res.status(400).json({ error: "Invalid market data format. 'symbol' and 'prices' array required." });
    }

    console.log(`📡 [API] Received Sniper Request for ${symbol} from SignalGenius_AI`);

    try {
        const marketData = {
            symbol,
            currentPrice: currentPrice || prices[prices.length - 1],
            prices,
            volume: volume || [],
            direction: direction || 'LONG'
        };

        const result = await analyzeSignalWithAgents(marketData);

        // Standardized Enterprise Response
        res.json(result);

    } catch (error) {
        console.error(`💥 [API_ERROR]`, error.message);
        res.status(500).json({
            provider: "Quantix AI Core v2.5",
            error: "Internal Brain Error during analysis",
            details: error.message,
            disclaimer: "Powered by Quantix AI Core"
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: "online", version: "2.5.0-SNIPER", heartbeat: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log('\n============================================================');
    console.log('🚀 QUANTIX AI CORE v2.5 - ENTERPRISE API SERVER ONLINE');
    console.log(`📍 Endpoint: http://localhost:${PORT}/api/v2/get-sniper-signal`);
    console.log(`🛡️  Security: SignalGenius API Key Required`);
    console.log('============================================================\n');
});
