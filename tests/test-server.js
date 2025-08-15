// Test Server Connectivity
console.log('🧪 Testing server connectivity...');

// Test basic server endpoint
fetch('/api/test')
    .then(response => response.json())
    .then(data => {
        console.log('✅ Server is running:', data);
    })
    .catch(error => {
        console.error('❌ Server test failed:', error);
    });

// Test OAuth endpoint
fetch('/api/auth/google/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: true })
})
.then(response => {
    console.log('✅ OAuth endpoint accessible (status:', response.status, ')');
    return response.json();
})
.then(data => {
    console.log('OAuth endpoint response:', data);
})
.catch(error => {
    console.error('❌ OAuth endpoint error:', error);
});

console.log('🏁 Server connectivity test completed'); 