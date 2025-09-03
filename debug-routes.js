// Debug script to check server status and routes
const http = require('http');

console.log('🔍 Debugging Archive Routes Issue\n');

// Test 1: Check if server is running
console.log('1️⃣ Testing server connectivity...');
const testServer = http.get('http://localhost:3000/healthz', (res) => {
    console.log(`   ✅ Server is running - Status: ${res.statusCode}`);
    
    // Test 2: Check if archive routes are accessible
    console.log('\n2️⃣ Testing archive routes...');
    
    const routes = [
        { path: '/api/bookings/archived', method: 'GET' },
        { path: '/api/bookings/TEST001/archive', method: 'POST' },
        { path: '/api/bookings/TEST001/unarchive', method: 'POST' }
    ];
    
    routes.forEach((route, index) => {
        setTimeout(() => {
            const options = {
                hostname: 'localhost',
                port: 3000,
                path: route.path,
                method: route.method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const req = http.request(options, (res) => {
                console.log(`   ${route.method} ${route.path} - Status: ${res.statusCode}`);
                
                if (res.statusCode === 404) {
                    console.log(`      ❌ Route not found - Possible causes:`);
                    console.log(`         • Server needs restart`);
                    console.log(`         • Route conflict`);
                    console.log(`         • Syntax error in server.js`);
                } else if (res.statusCode === 401) {
                    console.log(`      🔒 Unauthorized - Route exists but needs auth`);
                } else if (res.statusCode === 200) {
                    console.log(`      ✅ Route is working`);
                }
            });
            
            req.on('error', (err) => {
                console.log(`   ❌ ${route.method} ${route.path} - Error: ${err.message}`);
            });
            
            req.end();
        }, index * 500); // Test routes with 500ms delay between each
    });
    
}).on('error', (err) => {
    console.log(`   ❌ Server not accessible: ${err.message}`);
    console.log('\n🚨 Solutions:');
    console.log('   1. Make sure server is running: node server.js');
    console.log('   2. Check if port 3000 is available');
    console.log('   3. Verify no other server is running on the same port');
});

console.log('\n📋 Debug Summary:');
console.log('- If routes return 404, the server needs to be restarted');
console.log('- If server is not accessible, check if it\'s running');
console.log('- Archive routes should be defined in server.js around lines 1055-1131');

console.log('\n🔄 To fix 404 errors:');
console.log('   1. Stop the server (Ctrl+C)');
console.log('   2. Start it again: node server.js');
console.log('   3. Run this debug script again');
