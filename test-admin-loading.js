// Test script for admin panel loading issues
// Run this in the browser console on the admin page

console.log('🧪 === ADMIN PANEL LOADING TEST ===');

// Test 1: Check if OAuth system is loaded
console.log('Test 1: OAuth System Check');
console.log('SimpleGoogleAuth available:', !!window.simpleGoogleAuth);
if (window.simpleGoogleAuth) {
    console.log('Is authenticated:', window.simpleGoogleAuth.isUserAuthenticated());
    console.log('User profile:', window.simpleGoogleAuth.userProfile);
} else {
    console.log('❌ SimpleGoogleAuth not available');
}

// Test 2: Check server connection
console.log('\nTest 2: Server Connection Check');
async function testServer() {
    try {
        const response = await fetch('/api/test');
        const data = await response.json();
        console.log('✅ Server test response:', data);
        return true;
    } catch (error) {
        console.error('❌ Server test failed:', error);
        return false;
    }
}

// Test 3: Check authentication headers
console.log('\nTest 3: Authentication Headers Check');
if (window.simpleGoogleAuth && window.simpleGoogleAuth.isUserAuthenticated()) {
    const headers = window.simpleGoogleAuth.getAuthHeaders();
    console.log('Auth headers:', headers);
} else {
    console.log('❌ Not authenticated');
}

// Test 4: Manual booking load test
console.log('\nTest 4: Manual Booking Load Test');
async function testBookingLoad() {
    if (!window.simpleGoogleAuth || !window.simpleGoogleAuth.isUserAuthenticated()) {
        console.log('❌ Not authenticated, cannot test booking load');
        return;
    }
    
    try {
        console.log('🔄 Testing booking load...');
        const response = await fetch('/api/bookings', {
            headers: window.simpleGoogleAuth.getAuthHeaders()
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const bookings = await response.json();
            console.log('✅ Bookings loaded:', bookings.length);
            console.log('Sample booking:', bookings[0]);
        } else {
            const errorText = await response.text();
            console.error('❌ Booking load failed:', response.status, errorText);
        }
    } catch (error) {
        console.error('❌ Booking load error:', error);
    }
}

// Run all tests
async function runAllTests() {
    console.log('\n🧪 Running all tests...');
    
    // Test server connection
    const serverOk = await testServer();
    
    // Test booking load if authenticated
    if (window.simpleGoogleAuth && window.simpleGoogleAuth.isUserAuthenticated()) {
        await testBookingLoad();
    }
    
    console.log('\n🧪 === TEST COMPLETE ===');
    console.log('To debug further, run:');
    console.log('- debugAdminPanel()');
    console.log('- testServerConnection()');
    console.log('- testBookingLoad()');
}

// Auto-run tests after a short delay
setTimeout(runAllTests, 1000); 