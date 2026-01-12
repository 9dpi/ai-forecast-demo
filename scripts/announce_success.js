import { sendSystemMessage } from '../backend/bot.js';
import dotenv from 'dotenv';
dotenv.config();

const announcement = `
🚀 **SYSTEM UPGRADE SUCCESSFUL: SIGNAL GENIUS AI IS LIVE** 🚀

We are pleased to announce that the transition to **Signal Genius AI** (V1.8) is now complete. The system has been fully stabilized and optimized for institutional-grade performance.

✨ **Key Upgrades:**
• **Modern Rebranding**: Unified Signal Genius AI interface across all touchpoints.
• **Dynamic Surveillance**: Always-on display ensures you never face an empty screen.
• **Risk Transparency**: Real-time risk labeling (Speculative / Stable / High Conviction).
• **Real-time Precision**: Ultra-low latency price synchronization (5s global refresh).
• **Infrastructure Stability**: Zero-downtime deployment on Railway & GitHub.

The dashboard is now 100% operational and synced with our AI Council.

👉 **Monitor Performance**: [Signal Genius AI Live Dashboard](https://9dpi.github.io/ai-forecast-demo/#/mvp)

*The wait for the golden setup is over. The Council is scanning...* 👁️
`;

async function notify() {
    console.log("📨 Sending success announcement to Telegram...");
    const success = await sendSystemMessage(announcement);
    if (success) {
        console.log("✅ Announcement sent successfully!");
    } else {
        console.log("❌ Failed to send announcement. Check your bot tokens.");
    }
    process.exit();
}

notify();
