import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function testVIPCommand() {
    console.log('🧪 Testing /vip command with REAL data...\n');

    // Simulate /vip command
    const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

    const message = {
        chat_id: CHAT_ID,
        text: '/vip',
        parse_mode: 'Markdown'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        });

        const data = await response.json();
        console.log('✅ Command sent successfully!');
        console.log('Response:', JSON.stringify(data, null, 2));

        // Wait for bot response
        console.log('\n⏳ Waiting 5 seconds for bot response...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Get updates
        const updatesUrl = `https://api.telegram.org/bot${TOKEN}/getUpdates?limit=5&offset=-5`;
        const updatesResponse = await fetch(updatesUrl);
        const updates = await updatesResponse.json();

        if (updates.ok && updates.result.length > 0) {
            const lastMessage = updates.result[updates.result.length - 1];
            if (lastMessage.message && lastMessage.message.text) {
                console.log('📨 Bot Response:');
                console.log(lastMessage.message.text);
            }
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

testVIPCommand();
