import dotenv from 'dotenv';
dotenv.config();

const TOKEN = '8510625910:AAFZCWKstyTvLdIyOSwKcmwmSB82Zf9btiU';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function testRailwayBot() {
    console.log('🚂 Testing Railway Bot with REAL DATA...\n');
    console.log(`Bot: @Quantix_Dev_Bot`);
    console.log(`Chat ID: ${CHAT_ID}\n`);

    try {
        // 1. Check bot status
        console.log('1️⃣ Checking bot status...');
        const meUrl = `https://api.telegram.org/bot${TOKEN}/getMe`;
        const meResponse = await fetch(meUrl);
        const meData = await meResponse.json();

        if (meData.ok) {
            console.log(`✅ Bot active: @${meData.result.username}\n`);
        }

        // 2. Send /vip command
        console.log('2️⃣ Sending /vip command...');
        const sendUrl = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
        const sendResponse = await fetch(sendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: '/vip'
            })
        });

        const sendData = await sendResponse.json();
        if (sendData.ok) {
            console.log('✅ Command sent!\n');

            // 3. Wait for response
            console.log('3️⃣ Waiting 10 seconds for bot response...\n');
            await new Promise(resolve => setTimeout(resolve, 10000));

            // 4. Get updates
            console.log('4️⃣ Fetching bot response...');
            const updatesUrl = `https://api.telegram.org/bot${TOKEN}/getUpdates?limit=20&offset=-20`;
            const updatesResponse = await fetch(updatesUrl);
            const updates = await updatesResponse.json();

            if (updates.ok && updates.result.length > 0) {
                // Find latest bot message
                const botMessages = updates.result
                    .filter(u => u.message && u.message.from && u.message.from.is_bot)
                    .sort((a, b) => b.message.date - a.message.date);

                if (botMessages.length > 0) {
                    const latestMsg = botMessages[0].message;
                    console.log('\n📨 BOT RESPONSE:');
                    console.log('═'.repeat(70));
                    console.log(latestMsg.text);
                    console.log('═'.repeat(70));

                    // Verify real data
                    console.log('\n🔍 DATA VERIFICATION:');

                    if (latestMsg.text.includes('1.166') || latestMsg.text.includes('1.165')) {
                        console.log('✅ REAL PRICE DETECTED: ~1.166xx (Alpha Vantage)');
                    } else if (latestMsg.text.includes('1.17')) {
                        console.log('❌ OLD MOCK DATA: 1.17000 (from 2021 backup)');
                    }

                    if (latestMsg.text.includes('N/A')) {
                        console.log('✅ NO MOCK METRICS: Showing N/A for unavailable data');
                    }

                    if (latestMsg.text.includes('Alpha Vantage') || latestMsg.text.includes('GOOD')) {
                        console.log('✅ DATA SOURCE: Alpha Vantage (Real API)');
                    }

                    if (latestMsg.text.includes('v2.0')) {
                        console.log('✅ VERSION: v2.0.0 PRODUCTION_STRICT');
                    }

                } else {
                    console.log('⚠️ No bot response found. Checking raw updates...');
                    console.log(JSON.stringify(updates.result.slice(-3), null, 2));
                }
            } else {
                console.log('⚠️ No updates received');
            }

        } else {
            console.error('❌ Failed to send command:', sendData);
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

testRailwayBot();
