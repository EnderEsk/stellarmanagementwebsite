// Admin Configuration for Browser
// This file is loaded in the browser, so we can't use Node.js require()

const ADMIN_CONFIG = {
    // Admin password - will be set by server
    PASSWORD: 'stellar2024', // Default only for development
    
    // Session timeout in minutes (0 = no timeout)
    // Use longer timeout in production to prevent premature expiration
    SESSION_TIMEOUT: 120, // 2 hours for production
    
    // Maximum login attempts before temporary lockout
    MAX_LOGIN_ATTEMPTS: 5,
    
    // Lockout duration in minutes
    LOCKOUT_DURATION: 15,
    
    // Admin email for notifications
    ADMIN_EMAIL: 'admin@stellartreemanagement.com',
    
    // Company name for branding
    COMPANY_NAME: 'Stellar Tree Management'
};

// Make available globally for browser use
window.ADMIN_CONFIG = ADMIN_CONFIG; 