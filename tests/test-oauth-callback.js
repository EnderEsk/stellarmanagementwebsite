// Test OAuth Callback Endpoint
console.log('🧪 Testing OAuth callback endpoint...');

async function testOAuthCallback() {
    try {
        const response = await fetch('/api/auth/google/callback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: 'test_code' })
        });
        
        const data = await response.json();
        console.log('📊 Response status:', response.status);
        console.log('📊 Response data:', data);
        
        if (response.ok) {
            console.log('✅ OAuth callback endpoint is working!');
        } else {
            console.log('❌ OAuth callback endpoint returned error:', data.error);
        }
        
    } catch (error) {
        console.error('❌ Error testing OAuth callback:', error);
    }
}

// Test the endpoint
testOAuthCallback(); 