// Simple Authentication Test (Bypass Google OAuth for testing)
console.log('🧪 Simple Authentication Test...');

// Test function to simulate Google login
function testGoogleLogin() {
    console.log('🔄 Testing Google login simulation...');
    
    // Simulate Google user data
    const testUserData = {
        idToken: 'test_token',
        email: 'aiplanet100@gmail.com',
        name: 'Test Admin User',
        picture: 'https://via.placeholder.com/150'
    };
    
    console.log('📧 Testing with email:', testUserData.email);
    
    // Test backend verification
    fetch('/api/auth/google/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUserData)
    })
    .then(response => {
        console.log('✅ Backend response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('✅ Backend response:', data);
        if (data.success) {
            console.log('🎉 Authentication successful!');
            // Simulate successful login
            if (window.oauthAuth) {
                window.oauthAuth.handleSuccessfulLogin(data.userProfile, 'google');
            }
        } else {
            console.log('❌ Authentication failed:', data.error);
        }
    })
    .catch(error => {
        console.error('❌ Backend test failed:', error);
    });
}

// Add test button to page
function addTestButton() {
    const testButton = document.createElement('button');
    testButton.textContent = '🧪 Test Auth (Bypass Google)';
    testButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 10000;
        background: #ff6b6b;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
    `;
    testButton.onclick = testGoogleLogin;
    document.body.appendChild(testButton);
}

// Add test button when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addTestButton);
} else {
    addTestButton();
}

console.log('🏁 Simple auth test ready - look for the red test button!'); 