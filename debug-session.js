// Debug script to check session configuration
require('dotenv').config();

console.log('=== Session Debug Information ===');
console.log('Environment Variables:');
console.log('SESSION_TIMEOUT:', process.env.SESSION_TIMEOUT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

console.log('\nCalculated Values:');
const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT) || 60;
console.log('Session Timeout (minutes):', sessionTimeout);
console.log('Session Timeout (milliseconds):', sessionTimeout * 60 * 1000);

console.log('\nCurrent Time:');
console.log('Local Time:', new Date().toLocaleString());
console.log('UTC Time:', new Date().toISOString());
console.log('Timestamp:', Date.now());

console.log('\nSession Test:');
const testSession = {
    timestamp: Date.now(),
    timeout: sessionTimeout
};
console.log('Test Session:', testSession);

// Simulate session check
setTimeout(() => {
    const elapsed = (Date.now() - testSession.timestamp) / 60000;
    console.log('Elapsed time (minutes):', elapsed);
    console.log('Session expired?', elapsed >= testSession.timeout);
}, 1000); 