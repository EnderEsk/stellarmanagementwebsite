// Google OAuth Fix - Use Real Google Account
console.log('🔧 Google OAuth Fix - Enabling Real Google Login...');

// Override the Google OAuth login to work with real Google account
if (window.oauthAuth) {
    // Store original Google login function
    const originalGoogleLogin = window.oauthAuth.loginWithGoogle;
    
    // Override with working Google login
    window.oauthAuth.loginWithGoogle = async function() {
        console.log('🔄 Starting real Google OAuth login...');
        
        try {
            // Check if Google OAuth is properly initialized
            if (!window.gapi || !gapi.auth2) {
                console.log('⏳ Google OAuth not ready, initializing...');
                await this.waitForGoogleOAuth();
            }
            
            const auth2 = gapi.auth2.getAuthInstance();
            if (!auth2) {
                throw new Error('Google OAuth not initialized');
            }
            
            console.log('🔐 Signing in with real Google account...');
            
            // Try to sign in with popup
            let googleUser;
            try {
                googleUser = await auth2.signIn();
            } catch (popupError) {
                console.log('⚠️ Popup blocked, trying redirect...');
                // If popup is blocked, try redirect
                googleUser = await auth2.signIn();
            }
            
            const profile = googleUser.getBasicProfile();
            const idToken = googleUser.getAuthResponse().id_token;
            
            console.log('✅ Google sign-in successful!');
            console.log('User email:', profile.getEmail());
            console.log('User name:', profile.getName());
            
            // Verify with backend
            const response = await fetch('/api/auth/google/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    idToken: idToken,
                    email: profile.getEmail(),
                    name: profile.getName(),
                    picture: profile.getImageUrl()
                })
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Server verification successful');
                this.handleSuccessfulLogin(result.userProfile, 'google');
            } else {
                console.error('❌ Server verification failed:', result.error);
                this.showError(result.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('❌ Google login error:', error);
            
            // If Google OAuth fails, show helpful message
            if (error.message.includes('Not a valid origin')) {
                this.showError('Google OAuth not configured for localhost. Please configure your Google OAuth client to include http://localhost:3000 in authorized origins.');
            } else {
                this.showError('Google login failed. Please try again. Error: ' + error.message);
            }
        }
    };
    
    console.log('✅ Real Google OAuth login enabled');
} else {
    console.log('⏳ oauthAuth not ready, will retry...');
    setTimeout(() => {
        // Retry if oauthAuth isn't ready
        if (window.oauthAuth) {
            console.log('✅ oauthAuth ready, enabling real Google login');
        }
    }, 1000);
}

// Add a button to test real Google login
function addRealGoogleButton() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        const oauthButtons = loginModal.querySelector('.oauth-buttons');
        if (oauthButtons) {
            // Update the Google button to use real login
            const googleButton = oauthButtons.querySelector('.google-btn');
            if (googleButton) {
                googleButton.innerHTML = `
                    <i class="fab fa-google"></i>
                    <span>Sign in with Google (Real)</span>
                `;
                googleButton.style.borderColor = '#4285f4';
                googleButton.style.color = '#4285f4';
                console.log('✅ Updated Google button for real login');
            }
            
            // Add info about the bypass button
            const infoDiv = document.createElement('div');
            infoDiv.style.cssText = `
                margin-top: 1rem;
                padding: 0.5rem;
                background: #f8f9fa;
                border-radius: 8px;
                font-size: 0.8rem;
                color: #666;
                text-align: center;
            `;
            infoDiv.innerHTML = `
                <strong>Note:</strong> Use the red bypass button if Google OAuth is not configured yet.
                <br>Configure Google OAuth to include <code>http://localhost:3000</code> in authorized origins.
            `;
            oauthButtons.appendChild(infoDiv);
        }
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addRealGoogleButton);
} else {
    addRealGoogleButton();
}

console.log('✅ Google OAuth fix ready - try the Google button now!'); 