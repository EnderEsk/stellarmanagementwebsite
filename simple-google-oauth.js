// Simple Google OAuth Authentication System
// Works directly with your existing server

class SimpleGoogleOAuth {
    constructor() {
        this.isAuthenticated = false;
        this.userProfile = null;
        this.allowedEmails = [
            'aiplanet100@gmail.com',
            'stephanetmichaud@gmail.com',
            'aiplanet1000@gmail.com',
            'endereeska@gmail.com'
        ];
        
        // Google OAuth configuration (populated from server-provided config)
        this.googleClientId = null;
        this.googleRedirectUri = null;
        
        console.log('🚀 Initializing Simple Google OAuth...');
        // Expose an init promise so callers can await configuration readiness
        this.initPromise = this.init();
    }

    async init() {
        // Ensure admin config is loaded; fetch if not present
        if (!window.ADMIN_CONFIG) {
            try {
                const response = await fetch('/api/admin-config');
                if (response.ok) {
                    window.ADMIN_CONFIG = await response.json();
                }
            } catch (e) {
                console.warn('Failed to load admin config:', e);
            }
        }
        
        // Set OAuth configuration from server config
        this.googleClientId = window.ADMIN_CONFIG && window.ADMIN_CONFIG.GOOGLE_CLIENT_ID ? window.ADMIN_CONFIG.GOOGLE_CLIENT_ID : '';
        this.googleRedirectUri = window.ADMIN_CONFIG && window.ADMIN_CONFIG.GOOGLE_REDIRECT_URI ? window.ADMIN_CONFIG.GOOGLE_REDIRECT_URI : window.location.origin + '/admin.html';
        
        console.log('🔧 OAuth Config:', {
            clientId: this.googleClientId ? 'Set' : 'Missing',
            redirectUri: this.googleRedirectUri
        });
        
        // Check for existing session
        const sessionData = sessionStorage.getItem('adminOAuthSession');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session.authenticated && session.userProfile) {
                this.isAuthenticated = true;
                this.userProfile = session.userProfile;
                this.hideLoginModal();
                this.showAdminContent();
                this.updateUserInfo();
                console.log('✅ Restored session from storage');
                
                // Trigger booking loading after session restoration
                if (typeof loadBookings === 'function') {
                    console.log('🔄 Triggering booking load after session restoration...');
                    setTimeout(() => {
                        loadBookings();
                    }, 500);
                }
                return;
            }
        }
        
        this.showLoginModal();
    }

    async loginWithGoogle() {
        try {
            console.log('🔄 Starting Simple Google OAuth...');
            // Ensure config is loaded
            if (this.initPromise) {
                try { await this.initPromise; } catch (_) {}
            }
            if (!this.googleClientId) {
                console.error('❌ GOOGLE_CLIENT_ID is missing. Aborting OAuth start.');
                this.showError('Google login is not configured. Missing client ID.');
                return;
            }
            
            // Create Google OAuth URL
            const googleOAuthUrl = this.createGoogleOAuthUrl();
            
            // Redirect to Google OAuth
            window.location.href = googleOAuthUrl;
            
        } catch (error) {
            console.error('❌ Google OAuth error:', error);
            this.showError('Google login failed. Please try again.');
        }
    }

    createGoogleOAuthUrl() {
        if (!this.googleClientId) {
            throw new Error('Missing GOOGLE_CLIENT_ID when creating OAuth URL');
        }
        const redirect = this.googleRedirectUri || (window.location.origin + '/admin.html');
        const params = new URLSearchParams({
            client_id: this.googleClientId,
            redirect_uri: redirect,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'consent'
        });
        const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        console.log('🔗 Google OAuth URL being used:', url);
        return url;
    }

    async handleOAuthCallback(code) {
        try {
            console.log('🔄 Handling OAuth callback...');
            // Ensure initialization (and config load) has completed
            if (!this.googleClientId && this.initPromise) {
                await this.initPromise;
            }
            if (!this.googleClientId) {
                console.error('❌ Missing GOOGLE_CLIENT_ID in client config');
                console.log('ADMIN_CONFIG at runtime:', window.ADMIN_CONFIG);
                throw new Error('Client not configured with Google Client ID');
            }
            
            // Send code to your server for verification
            const response = await fetch('/api/auth/google/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code, redirectUri: this.googleRedirectUri })
            });
            
            console.log('📊 Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 Response data:', data);
                
                if (data.success && this.allowedEmails.includes(data.userProfile.email)) {
                    this.isAuthenticated = true;
                    this.userProfile = data.userProfile;
                    
                    // Store session
                    sessionStorage.setItem('adminOAuthSession', JSON.stringify({
                        authenticated: true,
                        userProfile: this.userProfile,
                        timestamp: Date.now()
                    }));
                    
                    this.hideLoginModal();
                    this.showAdminContent();
                    this.updateUserInfo();
                    
                    this.showNotification('Successfully logged in with Google!', 'success');
                    console.log('✅ Google OAuth login successful');
                    
                    // Trigger booking loading after successful authentication
                    if (typeof loadBookings === 'function') {
                        console.log('🔄 Triggering booking load after successful login...');
                        setTimeout(() => {
                            loadBookings();
                        }, 500);
                    } else {
                        console.log('⚠️ loadBookings function not available, reloading page...');
                        // Fallback: reload the page to ensure all components are updated
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    }
                } else {
                    this.showError('Access denied. This email is not authorized.');
                }
            } else {
                const errorData = await response.json();
                console.error('❌ Server error:', errorData);
                const combined = [errorData.error, errorData.details].filter(Boolean).join(' - ');
                throw new Error(`Server verification failed: ${combined || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('❌ OAuth callback error:', error);
            this.showError('Login failed. Please try again.');
        }
    }

    async logout() {
        console.log('🔄 Logging out...');
        
        this.isAuthenticated = false;
        this.userProfile = null;
        
        // Clear session
        sessionStorage.removeItem('adminOAuthSession');
        
        this.showLoginModal();
        this.hideAdminContent();
        
        this.showNotification('You have been logged out.', 'info');
    }

    // UI Management Methods
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.add('show');
        }
        this.hideAdminContent();
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    showAdminContent() {
        const adminContent = document.querySelector('.admin-container');
        if (adminContent) {
            adminContent.style.display = 'block';
        }
    }

    hideAdminContent() {
        const adminContent = document.querySelector('.admin-container');
        if (adminContent) {
            adminContent.style.display = 'none';
        }
    }

    updateUserInfo() {
        if (this.userProfile) {
            const userInfoElement = document.getElementById('userInfo');
            if (userInfoElement) {
                userInfoElement.innerHTML = `
                    <div class="user-profile">
                        <div class="user-avatar-placeholder">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-details">
                            <span class="user-name">${this.userProfile.name}</span>
                            <span class="user-email">${this.userProfile.email}</span>
                        </div>
                    </div>
                `;
            }
        }
    }

    showError(message) {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

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

    // Get auth headers for API calls
    getAuthHeaders() {
        if (this.isAuthenticated && this.userProfile) {
            return {
                'Authorization': `Bearer ${this.userProfile.email}`,
                'Content-Type': 'application/json'
            };
        }
        return {};
    }

    // Check if user is authenticated
    isUserAuthenticated() {
        return this.isAuthenticated;
    }
}

// Initialize simple Google OAuth when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing Simple Google OAuth System...');
    
    window.simpleGoogleAuth = new SimpleGoogleOAuth();
    console.log('✅ Simple Google OAuth System initialized');
    
    // Wait for initialization to finish so config is available
    if (window.simpleGoogleAuth.initPromise) {
        try {
            await window.simpleGoogleAuth.initPromise;
        } catch (e) {
            console.warn('Initialization encountered an error:', e);
        }
    }

    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    console.log('🔍 Checking for OAuth callback...');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 URL params:', window.location.search);
    console.log('🔍 Code found:', code);
    
    if (code) {
        console.log('🔄 OAuth callback detected, handling...');
        window.simpleGoogleAuth.handleOAuthCallback(code);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        console.log('ℹ️ No OAuth callback detected');
    }
}); 