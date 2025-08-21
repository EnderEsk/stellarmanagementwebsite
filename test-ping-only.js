const http = require('http');

console.log('🧪 Testing Ping Endpoint Only');
console.log('This will work even if database is down!');
console.log('');

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/ping',
    method: 'GET'
}, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`📊 Response Time: ${res.headers.date}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            console.log('📄 Response:', JSON.stringify(jsonData, null, 2));
            console.log('');
            console.log('🎯 This endpoint will keep Render awake!');
            console.log('💡 UptimeRobot will ping this every 5 minutes');
            console.log('🚫 Render will never sleep (15 min limit)');
        } catch (e) {
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Error: ${e.message}`);
});

req.end();
