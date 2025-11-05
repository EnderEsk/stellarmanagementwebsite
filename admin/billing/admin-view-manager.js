/**
 * Admin View Manager
 * Manages transitions between admin views (booking/billing)
 */

class AdminViewManager {
    constructor() {
        this.currentView = 'admin';
        this.views = {
            admin: {
                elements: [
                    '.bookings-container',
                    '.admin-sidebar',
                    '.mobile-sidebar',
                    '.desktop-sidebar',
                    '.history-section'
                ],
                onShow: () => {
                    console.log('Showing admin view');
                },
                onHide: () => {
                    console.log('Hiding admin view');
                }
            },
            billing: {
                elements: ['#billingView'],
                onShow: async () => {
                    console.log('Showing billing view');
                    if (window.adminBilling) {
                        await window.adminBilling.init();
                    }
                },
                onHide: () => {
                    console.log('Hiding billing view');
                }
            }
        };
    }

    init() {
        console.log('Initializing Admin View Manager...');
        this.createBillingView();
        this.currentView = 'admin'; // Start with admin view
        console.log('Admin View Manager initialized');
    }

    createBillingView() {
        // Check if billing view already exists
        let billingView = document.getElementById('billingView');
        if (billingView) return;

        // Create billing view element
        billingView = document.createElement('div');
        billingView.id = 'billingView';
        billingView.className = 'billing-view';
        billingView.style.display = 'none';

        // Find the admin container and add billing view after it
        const adminContainer = document.querySelector('.admin-container');
        if (adminContainer) {
            adminContainer.appendChild(billingView);
        } else {
            // Fallback: add to body
            document.body.appendChild(billingView);
        }
    }

    async showView(viewName) {
        if (!this.views[viewName]) {
            console.error(`View "${viewName}" not found`);
            return;
        }

        if (this.currentView === viewName) {
            console.log(`Already showing view: ${viewName}`);
            return;
        }

        console.log(`Switching from ${this.currentView} to ${viewName}`);

        // Hide current view
        await this.hideCurrentView();

        // Show new view
        await this.showNewView(viewName);

        // Update current view
        this.currentView = viewName;

        // Update page title if needed
        this.updatePageTitle(viewName);
    }

    async hideCurrentView() {
        const currentViewConfig = this.views[this.currentView];
        if (!currentViewConfig) return;

        // Call onHide hook
        if (currentViewConfig.onHide) {
            currentViewConfig.onHide();
        }

        // Hide elements
        currentViewConfig.elements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.style.display = 'none';
            });
        });
    }

    async showNewView(viewName) {
        const newViewConfig = this.views[viewName];
        if (!newViewConfig) return;

        // Show elements
        newViewConfig.elements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.style.display = '';
            });
        });

        // Call onShow hook
        if (newViewConfig.onShow) {
            await newViewConfig.onShow();
        }
    }

    updatePageTitle(viewName) {
        const titles = {
            admin: 'Admin Dashboard - Stellar Tree Management',
            billing: 'Billing - Stellar Tree Management'
        };

        if (titles[viewName]) {
            document.title = titles[viewName];
        }
    }

    getCurrentView() {
        return this.currentView;
    }

    // Utility method to check if a view is currently active
    isViewActive(viewName) {
        return this.currentView === viewName;
    }

    // Method to add custom views dynamically
    addView(viewName, config) {
        this.views[viewName] = config;
    }

    // Method to remove views
    removeView(viewName) {
        if (this.currentView === viewName) {
            console.warn(`Cannot remove currently active view: ${viewName}`);
            return false;
        }
        delete this.views[viewName];
        return true;
    }

    // Handle browser back/forward buttons
    handlePopState(event) {
        const state = event.state;
        if (state && state.view && this.views[state.view]) {
            this.showView(state.view);
        }
    }

    // Push state for browser history
    pushState(viewName) {
        const url = viewName === 'admin' ? '/admin' : `/admin/${viewName}`;
        history.pushState({ view: viewName }, '', url);
    }

    // Initialize browser history handling
    initHistoryHandling() {
        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });

        // Set initial state
        this.pushState(this.currentView);
    }
}

// Initialize global instance
window.adminViewManager = new AdminViewManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.adminViewManager.init();
    });
} else {
    window.adminViewManager.init();
}