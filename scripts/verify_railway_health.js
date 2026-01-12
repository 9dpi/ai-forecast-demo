import https from 'https';

const url = 'https://web-production-fbb05.up.railway.app/health';

console.log(`🌐 Pinging Railway Server: ${url} ...\n`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('✅ SERVER RESPONSE RECEIVED:');
            console.log(JSON.stringify(json, null, 2));
            if (json.status === 'ok') {
                console.log('\n🚀 STATUS: GLOBAL ONLINE');
            }
        } catch (e) {
            console.log('❌ Parse Error:', data);
        }
    });
}).on('error', (err) => {
    console.log('❌ Connection Error:', err.message);
});
