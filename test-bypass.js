// Test Bypass Authentication
console.log('🧪 Testing Bypass Authentication...');

// Test if bypass button exists
function checkBypassButton() {
    const bypassButton = document.querySelector('.bypass-btn');
    if (bypassButton) {
        console.log('✅ Bypass button found:', bypassButton.textContent);
        return true;
    } else {
        console.log('❌ Bypass button not found');
        return false;
    }
}

// Test if oauthAuth is available
function checkOAuthAuth() {
    if (window.oauthAuth) {
        console.log('✅ oauthAuth available');
        if (window.oauthAuth.loginWithBypass) {
            console.log('✅ loginWithBypass function available');
            return true;
        } else {
            console.log('❌ loginWithBypass function not available');
            return false;
        }
    } else {
        console.log('❌ oauthAuth not available');
        return false;
    }
}

// Test backend authentication
function testBackendAuth() {
    console.log('🔄 Testing backend authentication...');
    fetch('/api/auth/google/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'aiplanet100@gmail.com',
            name: 'Test User',
            idToken: 'test'
        })
    })
    .then(response => {
        console.log('✅ Backend response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('✅ Backend response:', data);
        if (data.success) {
            console.log('🎉 Backend authentication successful!');
        } else {
            console.log('❌ Backend authentication failed:', data.error);
        }
    })
    .catch(error => {
        console.error('❌ Backend test failed:', error);
    });
}

// Run all tests
setTimeout(() => {
    console.log('🏁 Running bypass tests...');
    checkBypassButton();
    checkOAuthAuth();
    testBackendAuth();
}, 2000);

console.log('✅ Bypass test script loaded'); 