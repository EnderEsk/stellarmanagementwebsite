// Final OAuth Test with New Credentials
console.log('🧪 Final OAuth Test with New Credentials...');

// Test configuration
if (window.ADMIN_CONFIG) {
    console.log('✅ Admin config loaded');
    console.log('Google Client ID:', window.ADMIN_CONFIG.GOOGLE_CLIENT_ID);
    console.log('Allowed emails:', window.ADMIN_CONFIG.ALLOWED_ADMIN_EMAILS);
} else {
    console.log('❌ Admin config not loaded');
}

// Test OAuth system
if (window.oauthAuth) {
    console.log('✅ OAuth authentication system initialized');
    console.log('Is authenticated:', window.oauthAuth.isUserAuthenticated());
} else {
    console.log('❌ OAuth authentication system not initialized');
}

// Test server connectivity
fetch('/api/test')
    .then(response => response.json())
    .then(data => {
        console.log('✅ Server is running:', data.message);
    })
    .catch(error => {
        console.error('❌ Server test failed:', error);
    });

console.log('🏁 Final test completed - Ready for OAuth login!'); 