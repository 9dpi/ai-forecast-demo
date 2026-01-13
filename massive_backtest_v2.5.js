/**
 * 📊 QUANTIX AI CORE - MASSIVE BACKTEST ENGINE v2.5
 * Chế độ: Local Deep Analysis
 * Author: Antigravity v2.5
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { analyzeSignalWithAgents } from './backend/signal_genius_core_v2.5_base.js';

dotenv.config();

const { Pool } = pg;
const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: { rejectUnauthorized: false }
};

async function runMassiveBacktest() {
    console.log("🚀 Initializing Massive Backtest Engine v2.5...");

    const pool = new Pool(config);
    let allCandles = [];

    try {
        console.log("📡 Fetching historical data from 'market_data' table...");
        const res = await pool.query(`
            SELECT timestamp_utc, open, high, low, close, volume 
            FROM market_data 
            WHERE symbol = 'EURUSD=X' 
            ORDER BY timestamp_utc ASC
        `);

        allCandles = res.rows.map(r => ({
            timestamp: r.timestamp_utc,
            open: parseFloat(r.open),
            high: parseFloat(r.high),
            low: parseFloat(r.low),
            close: parseFloat(r.close),
            volume: parseFloat(r.volume)
        }));

        console.log(`✅ Loaded ${allCandles.length} candles.`);

        if (allCandles.length < 50) {
            console.error("❌ Not enough data for meaningful backtest (need >50 candles).");
            return;
        }

        let totalPatternsDetected = 0;
        let sniperSignalsFired = 0;
        let rejectionStats = { confidence: 0, ema: 0, rsi: 0, shadow: 0 };
        let nearMisses = []; // Confidence > 80%
        let results = [];

        console.log(`\n⏳ Running deep analysis on ${allCandles.length} data points...`);

        // Window size for indicators (e.g. 50 candles)
        const WINDOW_SIZE = 50;

        for (let i = WINDOW_SIZE; i < allCandles.length; i++) {
            const currentCandle = allCandles[i];
            const history = allCandles.slice(i - WINDOW_SIZE, i + 1);

            const baseData = {
                symbol: 'EURUSD=X',
                currentPrice: currentCandle.close,
                prices: history.map(c => c.close),
                volume: history.map(c => c.volume),
                currentCandle: currentCandle
            };

            // Test both directions
            const directions = ['LONG', 'SHORT'];
            let bestResult = null;

            for (const dir of directions) {
                const result = await analyzeSignalWithAgents({ ...baseData, direction: dir });
                if (!bestResult || result.confidence > bestResult.confidence) {
                    bestResult = result;
                }
            }

            if (bestResult.confidence > 0) totalPatternsDetected++;

            if (bestResult.action !== 'NEUTRAL' && bestResult.shouldEmitSignal) {
                sniperSignalsFired++;
                results.push({
                    timestamp: currentCandle.timestamp,
                    action: bestResult.action,
                    confidence: bestResult.confidence,
                    price: currentCandle.close
                });
            } else {
                // Tracking Near-Misses (80% - 94%)
                if (bestResult.confidence >= 80) {
                    nearMisses.push({
                        timestamp: currentCandle.timestamp,
                        confidence: bestResult.confidence,
                        reason: bestResult.reasoning
                    });
                }

                // Thống kê lý do tại sao Sniper không bắn
                if (bestResult.confidence < 95) rejectionStats.confidence++;
                else if (bestResult.reasoning.includes("Price below EMA20") || bestResult.reasoning.includes("Price above EMA20")) rejectionStats.ema++;
                else if (bestResult.reasoning.includes("RSI Overbought") || bestResult.reasoning.includes("RSI Oversold")) rejectionStats.rsi++;
                else if (bestResult.reasoning.includes("Shadow Mode")) rejectionStats.shadow++;
            }

            if (i % 2000 === 0) {
                console.log(`... Processed ${i}/${allCandles.length} candles ...`);
            }
        }

        // --- IN KẾT QUẢ CUỐI CÙNG ---
        console.log("\n" + "=".repeat(50));
        console.log("📊 BÁO CÁO TỔNG LỰC QUANTIX AI CORE v2.5.1");
        console.log("-".repeat(50));
        console.log(`- Tổng nến đã quét: ${allCandles.length}`);
        console.log(`- Mẫu hình tiềm năng (Conf > 0): ${totalPatternsDetected}`);
        console.log(`- Số kèo GHOST/SILVER (Conf > 80): ${nearMisses.length}`);
        console.log(`- Số kèo SNIPER ELITE (Conf > 95): ${sniperSignalsFired}`);
        console.log("-".repeat(50));
        console.log("🛡️ PHÂN TÍCH LÝ DO TỪ CHỐI (REJECTION REASONS):");
        console.log(`1. Độ tự tin < 95%:        ${rejectionStats.confidence} lần`);
        console.log(`2. Ngược xu hướng (EMA20):  ${rejectionStats.ema} lần`);
        console.log(`3. Vùng giá nguy hiểm (RSI): ${rejectionStats.rsi} lần`);
        if (rejectionStats.shadow > 0) console.log(`4. Shadow Mode Filter:      ${rejectionStats.shadow} lần`);
        console.log("=".repeat(50));

        if (nearMisses.length > 0) {
            console.log("\n👀 TOP 5 NEAR-MISSES (CALIBRATION TARGETS):");
            nearMisses.sort((a, b) => b.confidence - a.confidence).slice(0, 5).forEach(m => {
                console.log(`[${new Date(m.timestamp).toISOString()}] Conf: ${m.confidence}% -> ${m.reason}`);
            });
        }

        if (sniperSignalsFired > 0) {
            console.log("\n🎯 RECENT ELITE SNIPER SIGNALS:");
            results.slice(-5).reverse().forEach(s => {
                console.log(`[${new Date(s.timestamp).toISOString()}] ${s.action} @ ${s.price} (Confidence: ${s.confidence}%)`);
            });
        }

    } catch (err) {
        console.error("❌ Backtest Engine Failure:", err);
    } finally {
        await pool.end();
    }
}

runMassiveBacktest();
