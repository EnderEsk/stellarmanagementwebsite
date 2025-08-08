// Admin Configuration for Browser
// This file is loaded in the browser, so we can't use Node.js require()

const ADMIN_CONFIG = {
    // OAuth Configuration - Client IDs only (secrets stay on server)
    GOOGLE_CLIENT_ID: '1081522229555-uj7744efea2p487bj7oa5p1janijfepl.apps.googleusercontent.com',
    MICROSOFT_CLIENT_ID: '', // Will be set when you provide Microsoft credentials
    
    // Allowed admin email addresses
    ALLOWED_ADMIN_EMAILS: [
        'aiplanet100@gmail.com',
        'stellartreemanagement@outlook.com',
        'stellartestmanagement@outlook.com',
        'stephanetmichaud@gmail.com',
        'aiplanet1000@gmail.com'
    ],
    
    // Session timeout in minutes (0 = no timeout)
    SESSION_TIMEOUT: 120, // 2 hours for production
    
    // Maximum login attempts before temporary lockout
    MAX_LOGIN_ATTEMPTS: 5,
    
    // Lockout duration in minutes
    LOCKOUT_DURATION: 15,
    
    // Admin email for notifications
    ADMIN_EMAIL: 'admin@stellartreemanagement.com',
    
    // Company name for branding
    COMPANY_NAME: 'Stellar Tree Management',
    
    // OAuth redirect URIs
    GOOGLE_REDIRECT_URI: window.location.origin + '/auth/google/callback',
    MICROSOFT_REDIRECT_URI: window.location.origin + '/auth/microsoft/callback'
};

// Make available globally for browser use
window.ADMIN_CONFIG = ADMIN_CONFIG; 