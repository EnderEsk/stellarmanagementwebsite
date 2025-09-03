// Test script to check if archive routes are working
const http = require('http');

const testRoutes = [
    '/api/bookings/archived',
    '/api/bookings/TEST001/archive',
    '/api/bookings/TEST001/unarchive'
];

console.log('🔍 Testing archive routes...\n');

testRoutes.forEach(route => {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: route,
        method: route.includes('/archive') || route.includes('/unarchive') ? 'POST' : 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`✅ ${route} - Status: ${res.statusCode}`);
        if (res.statusCode === 404) {
            console.log(`   ❌ Route not found - Server may need restart`);
        } else if (res.statusCode === 401) {
            console.log(`   🔒 Unauthorized - Route exists but needs auth`);
        } else {
            console.log(`   ✅ Route is accessible`);
        }
    });

    req.on('error', (err) => {
        console.log(`❌ ${route} - Error: ${err.message}`);
        if (err.code === 'ECONNREFUSED') {
            console.log(`   🚫 Server not running on port 3000`);
        }
    });

    req.end();
});

console.log('\n📋 Route Test Summary:');
console.log('- If you see 404 errors, the server needs to be restarted');
console.log('- If you see 401 errors, the routes exist but need authentication');
console.log('- If you see connection refused, the server is not running');
console.log('\n🔄 To fix 404 errors:');
console.log('1. Stop the server (Ctrl+C)');
console.log('2. Start it again: node server.js');
console.log('3. Test the routes again');
