// Temporary Appwrite Bypass for Testing
// This allows you to test the admin panel while setting up Appwrite

console.log('🔧 Appwrite Bypass Active - For testing only!');

// Override the AppwriteAuth class with a bypass version
class AppwriteAuthBypass {
    constructor() {
        this.isAuthenticated = false;
        this.userProfile = null;
        this.allowedEmails = [
            'aiplanet100@gmail.com',
            'stellartreemanagement@outlook.com'
        ];
        
        console.log('✅ Appwrite Bypass initialized');
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Appwrite Bypass...');
        
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
                console.log('✅ Restored session from bypass');
                return;
            }
        }
        
        this.showLoginModal();
    }

    async loginWithGoogle() {
        console.log('🔄 Bypass: Simulating Google OAuth login...');
        
        // Simulate successful login
        this.isAuthenticated = true;
        this.userProfile = {
            email: 'aiplanet100@gmail.com',
            name: 'Test User (Bypass)',
            picture: '',
            provider: 'google-bypass'
        };
        
        // Store session
        sessionStorage.setItem('adminOAuthSession', JSON.stringify({
            authenticated: true,
            userProfile: this.userProfile,
            timestamp: Date.now()
        }));
        
        this.hideLoginModal();
        this.showAdminContent();
        this.updateUserInfo();
        
        this.showNotification('Logged in via bypass (for testing)', 'info');
        console.log('✅ Bypass login successful');
    }

    async logout() {
        console.log('🔄 Bypass: Logging out...');
        
        this.isAuthenticated = false;
        this.userProfile = null;
        
        // Clear session
        sessionStorage.removeItem('adminOAuthSession');
        
        this.showLoginModal();
        this.hideAdminContent();
        
        this.showNotification('Logged out via bypass', 'info');
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
                            <span class="user-name">${this.userProfile.name} (Bypass)</span>
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

// Initialize bypass when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Appwrite Bypass System...');
    
    // Use bypass instead of real Appwrite for now
    window.appwriteAuth = new AppwriteAuthBypass();
    console.log('✅ Appwrite Bypass System initialized');
    
    // Add bypass button to login modal
    setTimeout(() => {
        const oauthButtons = document.querySelector('.oauth-buttons');
        if (oauthButtons) {
            const bypassButton = document.createElement('button');
            bypassButton.type = 'button';
            bypassButton.className = 'oauth-btn bypass-btn';
            bypassButton.style.backgroundColor = '#ff6b6b';
            bypassButton.onclick = () => window.appwriteAuth.loginWithGoogle();
            bypassButton.innerHTML = `
                <i class="fas fa-bolt"></i>
                <span>Quick Login (Bypass)</span>
            `;
            oauthButtons.appendChild(bypassButton);
            console.log('✅ Bypass button added to login modal');
        }
    }, 1000);
}); 