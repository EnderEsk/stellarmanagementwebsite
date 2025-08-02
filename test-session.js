// Test session timeout configuration
require('dotenv').config();

console.log('=== Session Timeout Test ===');

// Simulate the admin config logic
const NODE_ENV = process.env.NODE_ENV || 'development';
const SESSION_TIMEOUT = process.env.SESSION_TIMEOUT || 60;

const ADMIN_CONFIG = {
    SESSION_TIMEOUT: NODE_ENV === 'production' 
        ? (parseInt(SESSION_TIMEOUT) || 120)  // 2 hours in production
        : (parseInt(SESSION_TIMEOUT) || 60),   // 1 hour in development
};

console.log('Environment:', NODE_ENV);
console.log('SESSION_TIMEOUT from env:', SESSION_TIMEOUT);
console.log('Calculated timeout:', ADMIN_CONFIG.SESSION_TIMEOUT, 'minutes');

// Test session creation
const sessionData = {
    authenticated: true,
    timestamp: Date.now(),
    timeout: ADMIN_CONFIG.SESSION_TIMEOUT
};

console.log('Session data:', sessionData);

// Test session validation after 1 minute
setTimeout(() => {
    const elapsed = (Date.now() - sessionData.timestamp) / 60000;
    console.log('After 1 minute - Elapsed:', elapsed.toFixed(2), 'minutes');
    console.log('Session expired?', elapsed >= sessionData.timeout);
}, 60000);

console.log('Test will complete in 1 minute...'); 