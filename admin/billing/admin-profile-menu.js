/**
 * Admin Profile Menu Component
 * Handles the dropdown menu from the admin profile icon
 */

class AdminProfileMenu {
    constructor() {
        this.menuElement = null;
        this.isOpen = false;
        this.profileButton = null;
    }

    init() {
        console.log('Initializing Admin Profile Menu...');
        this.createMenuHTML();
        this.injectIntoHeader();
        this.attachEventListeners();
        console.log('Admin Profile Menu initialized');
    }

    createMenuHTML() {
        const menuHTML = `
            <div class="admin-profile-menu" id="adminProfileMenu" style="display: none;">
                <button class="profile-menu-item" data-action="home">
                    <i class="fas fa-home"></i>
                    <span>Home</span>
                </button>
                <button class="profile-menu-item" data-action="billing">
                    <i class="fas fa-credit-card"></i>
                    <span>Billing</span>
                </button>
                <button class="profile-menu-item" data-action="settings">
                    <i class="fas fa-cog"></i>
                    <span>Settings</span>
                    <span class="coming-soon-badge">Coming Soon</span>
                </button>
            </div>
        `;

        // Create a temporary div to hold the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = menuHTML;
        this.menuElement = tempDiv.firstElementChild;
    }

    injectIntoHeader() {
        // Find the admin user section in the header
        const adminUserSection = document.querySelector('.admin-user-section');
        if (!adminUserSection) {
            console.error('Admin user section not found');
            return;
        }

        // Find the user avatar - this will be the trigger element
        const userAvatar = adminUserSection.querySelector('.user-avatar');
        if (!userAvatar) {
            console.error('User avatar not found');
            return;
        }

        // Find the user info div - this will be the positioning context
        const userInfo = adminUserSection.querySelector('.admin-user-info');
        if (!userInfo) {
            console.error('Admin user info not found');
            return;
        }

        // Make userInfo a positioning context
        userInfo.style.position = 'relative';

        // Make user avatar clickable
        userAvatar.style.cursor = 'pointer';
        userAvatar.title = 'Profile Menu';
        userAvatar.setAttribute('aria-label', 'Open profile menu');
        userAvatar.setAttribute('role', 'button');
        userAvatar.setAttribute('tabindex', '0');

        // Add menu to userInfo so it's positioned relative to it
        userInfo.appendChild(this.menuElement);

        // Use userAvatar as the profile button
        this.profileButton = userAvatar;
    }

    attachEventListeners() {
        if (!this.profileButton || !this.menuElement) return;

        // Profile button (avatar) click
        this.profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Also handle keyboard events for accessibility
        this.profileButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            }
        });

        // Menu item clicks
        this.menuElement.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.profile-menu-item');
            if (!menuItem) return;

            const action = menuItem.dataset.action;
            this.handleMenuAction(action);
            this.close();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.menuElement.contains(e.target) && !this.profileButton.contains(e.target)) {
                this.close();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (!this.menuElement || !this.profileButton) return;

        // Position menu relative to admin-user-info (which is now the parent)
        // Menu should appear below the profile button, aligned to the right
        this.menuElement.style.position = 'absolute';
        this.menuElement.style.top = '100%';
        this.menuElement.style.right = '0';
        this.menuElement.style.marginTop = '8px';
        this.menuElement.style.zIndex = '10000';

        // Show menu
        this.menuElement.style.display = 'block';
        this.isOpen = true;

        // Add active state to profile button
        this.profileButton.classList.add('active');

        // Animate in
        requestAnimationFrame(() => {
            this.menuElement.classList.add('show');
        });
    }

    close() {
        if (!this.menuElement || !this.profileButton) return;

        this.menuElement.classList.remove('show');
        this.profileButton.classList.remove('active');
        this.isOpen = false;

        // Hide after animation
        setTimeout(() => {
            if (!this.isOpen) {
                this.menuElement.style.display = 'none';
            }
        }, 200);
    }

    handleMenuAction(action) {
        switch (action) {
            case 'home':
                this.navigateToHome();
                break;
            case 'billing':
                this.navigateToBilling();
                break;
            case 'settings':
                this.showComingSoon();
                break;
            default:
                console.warn('Unknown menu action:', action);
        }
    }

    navigateToHome() {
        if (window.adminViewManager) {
            window.adminViewManager.showView('admin');
        } else {
            console.warn('AdminViewManager not available');
        }
    }

    navigateToBilling() {
        if (window.adminViewManager) {
            window.adminViewManager.showView('billing');
        } else {
            console.warn('AdminViewManager not available');
        }
    }

    showComingSoon() {
        if (typeof showNotification === 'function') {
            showNotification('Settings feature coming soon!', 'info');
        } else {
            alert('Settings feature coming soon!');
        }
    }

    // Responsive positioning for mobile
    updatePosition() {
        if (!this.isOpen || !this.menuElement || !this.profileButton) return;

        // Menu is positioned relative to admin-user-info, so it should automatically adjust
        // But we can ensure it doesn't go off-screen on mobile
        const viewportWidth = window.innerWidth;
        const menuWidth = 200;
        
        // On mobile, ensure menu doesn't overflow
        if (viewportWidth < 768) {
            // Keep right alignment but ensure it doesn't go off left edge
            this.menuElement.style.right = '0';
            this.menuElement.style.left = 'auto';
        }
    }
}

// Initialize global instance
window.adminProfileMenu = new AdminProfileMenu();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.adminProfileMenu.init();
    });
} else {
    window.adminProfileMenu.init();
}

// Handle window resize for responsive positioning
window.addEventListener('resize', () => {
    if (window.adminProfileMenu) {
        window.adminProfileMenu.updatePosition();
    }
});