// Admin Configuration
// Load environment variables
require('dotenv').config();

const ADMIN_CONFIG = {
    // Admin password from environment variable
    PASSWORD: process.env.ADMIN_PASSWORD || 'stellar2024', // Default only for development
    
    // Session timeout in minutes (0 = no timeout)
    // Use longer timeout in production to prevent premature expiration
    SESSION_TIMEOUT: process.env.NODE_ENV === 'production' 
        ? (parseInt(process.env.SESSION_TIMEOUT) || 120)  // 2 hours in production
        : (parseInt(process.env.SESSION_TIMEOUT) || 60),   // 1 hour in development
    
    // Maximum login attempts before temporary lockout
    MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    
    // Lockout duration in minutes
    LOCKOUT_DURATION: parseInt(process.env.LOCKOUT_DURATION) || 15,
    
    // Admin email for notifications
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@stellartreemanagement.com',
    
    // Company name for branding
    COMPANY_NAME: process.env.COMPANY_NAME || 'Stellar Tree Management'
};

// Export for use in admin.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ADMIN_CONFIG;
} else {
    // For browser use
    window.ADMIN_CONFIG = ADMIN_CONFIG;
} 