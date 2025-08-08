// Test OAuth Authentication System

console.log('🧪 Starting OAuth Authentication Test...');

// Test the OAuth configuration
console.log('📋 Testing OAuth Configuration...');

// Check if admin config is loaded
if (window.ADMIN_CONFIG) {
    console.log('✅ Admin config loaded');
    console.log('Google Client ID:', window.ADMIN_CONFIG.GOOGLE_CLIENT_ID);
    console.log('Allowed emails:', window.ADMIN_CONFIG.ALLOWED_ADMIN_EMAILS);
} else {
    console.log('❌ Admin config not loaded');
}

// Check if OAuth auth is initialized
if (window.oauthAuth) {
    console.log('✅ OAuth authentication system initialized');
    console.log('Is authenticated:', window.oauthAuth.isUserAuthenticated());
} else {
    console.log('❌ OAuth authentication system not initialized');
}

// Test session storage
const sessionData = sessionStorage.getItem('adminOAuthSession');
if (sessionData) {
    console.log('✅ Session data found:', JSON.parse(sessionData));
} else {
    console.log('ℹ️ No session data found (normal for first visit)');
}

// Test Google OAuth availability
if (window.gapi) {
    console.log('✅ Google API (gapi) loaded');
    if (gapi.auth2) {
        console.log('✅ Google Auth2 available');
    } else {
        console.log('⚠️ Google Auth2 not yet initialized');
    }
} else {
    console.log('❌ Google API (gapi) not loaded');
}

// Test network connectivity
fetch('/api/auth/google/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: true })
}).then(response => {
    console.log('✅ Backend OAuth endpoint accessible (status:', response.status, ')');
}).catch(error => {
    console.log('❌ Backend OAuth endpoint error:', error.message);
});

console.log('🏁 OAuth test completed'); 