// Real Appwrite Authentication System
// Using actual Appwrite project configuration

class AppwriteAuthReal {
    constructor() {
        this.isAuthenticated = false;
        this.userProfile = null;
        this.allowedEmails = [
            'aiplanet100@gmail.com',
            'stellartreemanagement@outlook.com'
        ];
        
        // Initialize Appwrite client
        this.initAppwrite();
        
        // Initialize authentication
        this.init();
    }

    initAppwrite() {
        try {
            // Initialize Appwrite client with actual project details
            this.client = new Appwrite.Client()
                .setEndpoint('https://nyc.cloud.appwrite.io/v1')
                .setProject('689264a00037aee1476c');

            // Initialize Account
            this.account = new Appwrite.Account(this.client);
            
            console.log('✅ Appwrite client initialized with real project');
        } catch (error) {
            console.error('❌ Error initializing Appwrite client:', error);
        }
    }

    async init() {
        console.log('🚀 Initializing Real Appwrite Authentication...');
        
        // Check if user is already authenticated
        const authenticated = await this.isUserAuthenticated();
        if (authenticated) {
            await this.handleAuthenticatedUser();
        } else {
            this.showLoginModal();
        }
    }

    async isUserAuthenticated() {
        try {
            await this.account.get();
            return true;
        } catch (error) {
            return false;
        }
    }

    async getCurrentUser() {
        try {
            return await this.account.get();
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    async handleAuthenticatedUser() {
        try {
            const user = await this.getCurrentUser();
            console.log('✅ User already authenticated:', user);
            
            // Check if user email is in allowed list
            if (this.allowedEmails.includes(user.email)) {
                this.isAuthenticated = true;
                this.userProfile = {
                    email: user.email,
                    name: user.name || user.email,
                    picture: user.prefs?.avatar || '',
                    provider: 'appwrite'
                };
                
                this.hideLoginModal();
                this.showAdminContent();
                this.updateUserInfo();
                
                console.log('✅ Authenticated user has access to admin panel');
            } else {
                console.log('❌ User not authorized for admin access');
                await this.logout();
                this.showError('Access denied. This email is not authorized to access the admin panel.');
            }
        } catch (error) {
            console.error('❌ Error handling authenticated user:', error);
            this.showLoginModal();
        }
    }

    async loginWithGoogle() {
        try {
            console.log('🔄 Starting Real Google OAuth via Appwrite...');
            
            // Create OAuth session with Appwrite
            await this.account.createOAuth2Session(
                Appwrite.OAuthProvider.Google,
                'http://localhost:3000/admin.html', // Success URL
                'http://localhost:3000/admin.html'  // Failure URL
            );
            
            // Note: The page will redirect to the success URL after OAuth
            // The authentication will be handled when the page loads
            
        } catch (error) {
            console.error('❌ Google OAuth error:', error);
            this.showError('Google login failed. Please try again.');
        }
    }

    async logout() {
        try {
            await this.account.deleteSession('current');
            this.isAuthenticated = false;
            this.userProfile = null;
            
            // Clear any stored session data
            sessionStorage.removeItem('adminOAuthSession');
            
            // Update UI
            this.showLoginModal();
            this.hideAdminContent();
            
            this.showNotification('You have been logged out.', 'info');
            
        } catch (error) {
            console.error('❌ Logout error:', error);
        }
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

// Initialize real Appwrite authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Real Appwrite Authentication System...');
    
    // Wait for Appwrite SDK to load
    const checkAppwrite = () => {
        if (typeof Appwrite !== 'undefined') {
            window.appwriteAuth = new AppwriteAuthReal();
            console.log('✅ Real Appwrite Authentication System initialized');
        } else {
            console.log('⏳ Waiting for Appwrite SDK to load...');
            setTimeout(checkAppwrite, 100);
        }
    };
    
    checkAppwrite();
}); 