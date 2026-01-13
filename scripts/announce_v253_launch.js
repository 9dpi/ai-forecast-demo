import { sendSystemMessage } from '../backend/bot.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Quantix Elite v2.5.3 - Global Production Launch Announcement
 * Time: GMT +0
 */

const now = new Date();
const gmt0Time = now.toLocaleTimeString('en-GB', { timeZone: 'UTC' }) + ' UTC';
const gmt0Date = now.toLocaleDateString('en-GB', { timeZone: 'UTC' });

const announcement = `
🚀 **QUANTIX ELITE v2.5.3 - PRODUCTION LAUNCH SUCCESSFUL** 🚀

The Quantix AI Core has been successfully upgraded to **v2.5.3 (Sniper Elite Edition)**. All systems are green and operational.

🛡️ **Deployment Verified:**
• **Core Version**: v2.5.3-SNIPER-ELITE
• **Filter Status**: ACTIVE (Strict 95%+ Confidence)
• **Technical Pillar**: 100/100 Convergence Enabled
• **Bonus Pillar**: +6% Sniper Volume Boost Active
• **Environment**: Production (Railway Enterprise)

🕒 **Local Timestamp**: ${gmt0Date} | ${gmt0Time}

✨ **Upgrade Note**: The AI Council has shifted to "Sniping Mode". Signal quantity will decrease significantly in favor of ultra-high win rate setups.

👉 **View Live Stats**: [Quantix Official Portal](https://9dpi.github.io/ai-forecast-demo/)

*Precision is our only priority. The Sniper is listening...* 🎯🏹💎
`;

async function notify() {
    console.log("📨 Sending Quantix Elite v2.5.3 announcement (GMT+0)...");
    const success = await sendSystemMessage(announcement);
    if (success) {
        console.log("✅ Announcement sent successfully!");
    } else {
        console.log("❌ Failed to send announcement.");
    }
    process.exit();
}

notify();
