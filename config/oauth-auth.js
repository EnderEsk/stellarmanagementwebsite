// OAuth Authentication System for Stellar Tree Management Admin Panel

class OAuthAuth {
    constructor() {
        this.config = window.ADMIN_CONFIG;
        this.isAuthenticated = false;
        this.userProfile = null;
        this.sessionExpiry = null;
        
        // Initialize Google OAuth
        this.initGoogleOAuth();
        
        // Check for existing session
        this.checkExistingSession();
    }

    // Initialize Google OAuth
    initGoogleOAuth() {
        console.log('🔄 Initializing Google OAuth...');
        
        // Load Google OAuth library
        if (!window.gapi) {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                console.log('✅ Google API script loaded');
                this.initGoogleAuth2();
            };
            script.onerror = (error) => {
                console.error('❌ Failed to load Google API script:', error);
            };
            document.head.appendChild(script);
        } else {
            console.log('✅ Google API already loaded');
            this.initGoogleAuth2();
        }
    }
    
    // Initialize Google Auth2
    initGoogleAuth2() {
        gapi.load('auth2', () => {
            console.log('✅ Google Auth2 loaded');
            gapi.auth2.init({
                client_id: this.config.GOOGLE_CLIENT_ID,
                scope: 'email profile',
                ux_mode: 'popup',
                redirect_uri: window.location.origin,
                prompt: 'select_account'
            }).then(() => {
                console.log('✅ Google OAuth initialized successfully');
            }).catch(error => {
                console.error('❌ Google OAuth init error:', error);
                console.error('Error details:', error.message);
                
                // Try alternative initialization
                console.log('🔄 Trying alternative initialization...');
                try {
                    gapi.auth2.init({
                        client_id: this.config.GOOGLE_CLIENT_ID,
                        scope: 'email profile'
                    }).then(() => {
                        console.log('✅ Google OAuth initialized with alternative config');
                    }).catch(altError => {
                        console.error('❌ Alternative initialization also failed:', altError);
                    });
                } catch (initError) {
                    console.log('⚠️ Google OAuth already initialized, using existing instance');
                    // Try to get existing instance
                    try {
                        const auth2 = gapi.auth2.getAuthInstance();
                        if (auth2) {
                            console.log('✅ Using existing Google OAuth instance');
                        }
                    } catch (getError) {
                        console.error('❌ Could not get existing instance:', getError);
                    }
                }
            });
        });
    }

    // Check for existing valid session
    checkExistingSession() {
        const sessionData = this.getSessionData();
        if (sessionData && sessionData.authenticated && this.isSessionValid(sessionData)) {
            this.isAuthenticated = true;
            this.userProfile = sessionData.userProfile;
            this.sessionExpiry = sessionData.expiry;
            this.hideLoginModal();
            this.showAdminContent();
            this.updateUserInfo();
            
            // Load bookings if function exists
            if (typeof loadBookings === 'function') {
                console.log('🔄 Loading bookings from existing session...');
                loadBookings();
                
                // Add a fallback to ensure bookings are loaded
                setTimeout(() => {
                    if (typeof loadBookings === 'function') {
                        console.log('🔄 Fallback: Loading bookings from session again...');
                        loadBookings();
                    }
                }, 1500);
            }
        } else {
            this.showLoginModal();
        }
    }

    // Get session data from storage
    getSessionData() {
        const sessionStr = sessionStorage.getItem('adminOAuthSession');
        if (sessionStr) {
            try {
                return JSON.parse(sessionStr);
            } catch (e) {
                console.error('Error parsing session data:', e);
                return null;
            }
        }
        return null;
    }

    // Check if session is still valid
    isSessionValid(sessionData) {
        if (!sessionData || !sessionData.expiry) return false;
        
        const now = Date.now();
        const expiry = new Date(sessionData.expiry).getTime();
        
        return now < expiry;
    }

    // Google OAuth Login
    async loginWithGoogle() {
        try {
            console.log('🔄 Starting Google OAuth login...');
            
            // Check if Google OAuth is initialized
            if (!window.gapi || !gapi.auth2) {
                console.log('⏳ Google OAuth not ready, initializing...');
                await this.waitForGoogleOAuth();
            }
            
            const auth2 = gapi.auth2.getAuthInstance();
            if (!auth2) {
                throw new Error('Google OAuth not initialized');
            }
            
            console.log('🔐 Signing in with Google...');
            
            // Try to sign in with popup first
            let googleUser;
            try {
                googleUser = await auth2.signIn();
            } catch (popupError) {
                console.log('⚠️ Popup blocked, trying redirect...');
                // If popup is blocked, try redirect
                auth2.signIn().then((user) => {
                    console.log('✅ Redirect sign-in successful');
                    this.handleGoogleSignIn(user);
                }).catch((redirectError) => {
                    console.error('❌ Both popup and redirect failed:', redirectError);
                    this.showError('Google login failed. Please allow popups and try again.');
                });
                return; // Exit early for redirect flow
            }
            
            // Handle successful popup sign-in
            this.handleGoogleSignIn(googleUser);
            
        } catch (error) {
            console.error('❌ Google login error:', error);
            this.showError('Google login failed. Please try again. Error: ' + error.message);
        }
    }
    
    // Wait for Google OAuth to be ready
    async waitForGoogleOAuth() {
        return new Promise((resolve, reject) => {
            const checkGapi = () => {
                if (window.gapi && gapi.auth2) {
                    resolve();
                } else {
                    setTimeout(checkGapi, 100);
                }
            };
            checkGapi();
        });
    }

    // Microsoft OAuth Login
    async loginWithMicrosoft() {
        try {
            // Microsoft OAuth flow
            const msalConfig = {
                auth: {
                    clientId: this.config.MICROSOFT_CLIENT_ID,
                    authority: 'https://login.microsoftonline.com/common',
                    redirectUri: this.config.MICROSOFT_REDIRECT_URI
                }
            };

            // For now, we'll use a simple redirect approach
            // In production, you'd use MSAL.js library
            const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
                `client_id=${this.config.MICROSOFT_CLIENT_ID}&` +
                `response_type=code&` +
                `redirect_uri=${encodeURIComponent(this.config.MICROSOFT_REDIRECT_URI)}&` +
                `scope=openid%20email%20profile&` +
                `response_mode=query`;

            // Store state for security
            const state = this.generateState();
            sessionStorage.setItem('oauth_state', state);
            
            // Redirect to Microsoft login
            window.location.href = authUrl + `&state=${state}`;
            
        } catch (error) {
            console.error('Microsoft login error:', error);
            this.showError('Microsoft login failed. Please try again.');
        }
    }

    // Handle successful login
    handleSuccessfulLogin(userProfile, provider) {
        this.isAuthenticated = true;
        this.userProfile = userProfile;
        
        // Set session expiry
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + this.config.SESSION_TIMEOUT);
        this.sessionExpiry = expiry;

        // Save session data
        const sessionData = {
            authenticated: true,
            userProfile: userProfile,
            provider: provider,
            expiry: expiry.toISOString()
        };
        sessionStorage.setItem('adminOAuthSession', JSON.stringify(sessionData));

        // Update UI
        this.hideLoginModal();
        this.showAdminContent();
        this.updateUserInfo();
        
        // Load bookings and initialize admin panel
        if (typeof loadBookings === 'function') {
            console.log('🔄 Loading bookings after successful login...');
            loadBookings();
            
            // Add a fallback to ensure bookings are loaded
            setTimeout(() => {
                if (typeof loadBookings === 'function') {
                    console.log('🔄 Fallback: Loading bookings again...');
                    loadBookings();
                }
            }, 1000);
        }
        
        // Show success message
        this.showNotification(`Welcome back, ${userProfile.name}!`, 'success');
    }

    // Handle logout
    logout() {
        this.isAuthenticated = false;
        this.userProfile = null;
        this.sessionExpiry = null;
        
        // Clear session
        sessionStorage.removeItem('adminOAuthSession');
        
        // Sign out from Google if applicable
        if (window.gapi && gapi.auth2) {
            const auth2 = gapi.auth2.getAuthInstance();
            if (auth2.isSignedIn.get()) {
                auth2.signOut();
            }
        }
        
        // Update UI
        this.showLoginModal();
        this.hideAdminContent();
        
        this.showNotification('You have been logged out.', 'info');
    }

    // Show login modal
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('show');
        }
        this.hideAdminContent();
    }

    // Hide login modal
    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    // Show admin content
    showAdminContent() {
        const adminContent = document.querySelector('.admin-container');
        if (adminContent) {
            adminContent.style.display = 'block';
        }
    }

    // Hide admin content
    hideAdminContent() {
        const adminContent = document.querySelector('.admin-container');
        if (adminContent) {
            adminContent.style.display = 'none';
        }
    }

    // Update user info in UI
    updateUserInfo() {
        if (this.userProfile) {
            const userInfoElement = document.getElementById('userInfo');
            if (userInfoElement) {
                userInfoElement.innerHTML = `
                    <div class="user-profile">
                        <img src="${this.userProfile.picture || 'images/default-avatar.png'}" alt="Profile" class="user-avatar">
                        <div class="user-details">
                            <span class="user-name">${this.userProfile.name}</span>
                            <span class="user-email">${this.userProfile.email}</span>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Show error message
    showError(message) {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;

        // Add to body
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Hide and remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 400);
        }, 3000);
    }

    // Generate random state for OAuth security
    generateState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated && this.isSessionValid(this.getSessionData());
    }

    // Get auth headers for API calls
    getAuthHeaders() {
        const sessionData = this.getSessionData();
        if (sessionData && sessionData.authenticated) {
            return {
                'Authorization': `Bearer ${sessionData.userProfile.email}`,
                'Content-Type': 'application/json'
            };
        }
        return {};
    }
}

// Initialize OAuth authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing OAuth authentication system...');
    window.oauthAuth = new OAuthAuth();
    console.log('✅ OAuth authentication system initialized');
}); 