import dotenv from 'dotenv';
dotenv.config();

const TOKEN = '8510625910:AAFZCWKstyTvLdIyOSwKcmwmSB82Zf9btiU';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function testNewBot() {
    console.log('🧪 Testing @Quantix_Dev_Bot with REAL data...\n');

    // Send /vip command
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

    try {
        console.log('📤 Sending /vip command...');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: '/vip'
            })
        });

        const data = await response.json();
        if (data.ok) {
            console.log('✅ Command sent successfully!\n');

            // Wait for bot to process
            console.log('⏳ Waiting 8 seconds for bot response...\n');
            await new Promise(resolve => setTimeout(resolve, 8000));

            // Get latest messages
            const updatesUrl = `https://api.telegram.org/bot${TOKEN}/getUpdates?limit=10&offset=-10`;
            const updatesResponse = await fetch(updatesUrl);
            const updates = await updatesResponse.json();

            if (updates.ok && updates.result.length > 0) {
                // Find bot's response
                const botMessages = updates.result
                    .filter(u => u.message && u.message.from && u.message.from.is_bot)
                    .map(u => u.message);

                if (botMessages.length > 0) {
                    const lastBotMsg = botMessages[botMessages.length - 1];
                    console.log('📨 Bot Response:');
                    console.log('─'.repeat(60));
                    console.log(lastBotMsg.text);
                    console.log('─'.repeat(60));

                    // Check for real data indicators
                    if (lastBotMsg.text.includes('1.166')) {
                        console.log('\n✅ VERIFIED: Bot is using REAL data (price ~1.166xx)');
                    } else if (lastBotMsg.text.includes('1.17')) {
                        console.log('\n⚠️ WARNING: Bot may still be using old mock data (1.17)');
                    }

                    if (lastBotMsg.text.includes('N/A')) {
                        console.log('✅ VERIFIED: No mock metrics (showing N/A)');
                    }
                } else {
                    console.log('⚠️ No bot response found yet. Check Telegram manually.');
                }
            }
        } else {
            console.error('❌ Failed to send command:', data);
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

testNewBot();
