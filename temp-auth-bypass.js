// Temporary Authentication Bypass
// This allows you to test the admin panel while configuring Google OAuth

console.log('🔧 Temporary Auth Bypass Active');

// Override the OAuth login functions
function setupBypass() {
    if (window.oauthAuth) {
        // Add a bypass login function
        window.oauthAuth.loginWithBypass = function() {
            console.log('🔓 Using temporary auth bypass...');
            
            const testUserProfile = {
                email: 'aiplanet100@gmail.com',
                name: 'Admin User (Bypass)',
                picture: 'https://via.placeholder.com/150',
                provider: 'bypass'
            };
            
            this.handleSuccessfulLogin(testUserProfile, 'bypass');
            this.showNotification('Logged in via bypass (temporary)', 'info');
        };
        
        // Override the Google login to use bypass
        window.oauthAuth.loginWithGoogle = function() {
            console.log('🔄 Google OAuth not configured, using bypass...');
            this.loginWithBypass();
        };
        
        console.log('✅ Bypass functions added to oauthAuth');
    } else {
        console.log('⏳ oauthAuth not ready yet, retrying...');
        setTimeout(setupBypass, 100);
    }
}

// Add bypass button to login modal
function addBypassButton() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        const oauthButtons = loginModal.querySelector('.oauth-buttons');
        if (oauthButtons) {
            const bypassButton = document.createElement('button');
            bypassButton.type = 'button';
            bypassButton.className = 'oauth-btn bypass-btn';
            bypassButton.onclick = () => {
                console.log('🔓 Bypass button clicked');
                if (window.oauthAuth && window.oauthAuth.loginWithBypass) {
                    window.oauthAuth.loginWithBypass();
                } else {
                    console.log('❌ oauthAuth or loginWithBypass not available');
                    // Fallback: directly call the backend
                    fetch('/api/auth/google/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: 'aiplanet100@gmail.com',
                            name: 'Admin User (Bypass)',
                            idToken: 'bypass_token'
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            console.log('✅ Bypass authentication successful');
                            // Reload page to show admin panel
                            location.reload();
                        }
                    })
                    .catch(error => {
                        console.error('❌ Bypass failed:', error);
                    });
                }
            };
            bypassButton.innerHTML = `
                <i class="fas fa-unlock"></i>
                <span>Temporary Login (Bypass)</span>
            `;
            bypassButton.style.cssText = `
                border-color: #ff6b6b !important;
                color: #ff6b6b !important;
            `;
            bypassButton.onmouseover = function() {
                this.style.background = '#ff6b6b !important';
                this.style.color = 'white !important';
            };
            bypassButton.onmouseout = function() {
                this.style.background = 'white !important';
                this.style.color = '#ff6b6b !important';
            };
            
            oauthButtons.appendChild(bypassButton);
        }
    }
}

// Setup bypass functions and add button
function initializeBypass() {
    setupBypass();
    addBypassButton();
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBypass);
} else {
    initializeBypass();
}

console.log('✅ Temporary auth bypass ready - look for the red bypass button!'); 