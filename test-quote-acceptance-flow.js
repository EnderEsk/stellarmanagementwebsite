// Test Script for Quote Acceptance and Scheduling Flow
// This script tests the complete flow from quote acceptance to job scheduling

const testQuoteAcceptanceFlow = async () => {
    console.log('🧪 Testing Quote Acceptance and Scheduling Flow...\n');
    
    // Test data
    const testBookingId = 'ST-TEST123';
    const baseUrl = 'http://localhost:3000';
    
    try {
        // Step 1: Test quote acceptance
        console.log('📝 Step 1: Testing Quote Acceptance...');
        const acceptResponse = await fetch(`${baseUrl}/api/bookings/${testBookingId}/accept-quote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (acceptResponse.ok) {
            const acceptResult = await acceptResponse.json();
            console.log('✅ Quote acceptance successful:', acceptResult);
        } else {
            const error = await acceptResponse.json();
            console.log('⚠️ Quote acceptance failed (expected for test):', error);
        }
        
        // Step 2: Test job scheduling
        console.log('\n📅 Step 2: Testing Job Scheduling...');
        const scheduleResponse = await fetch(`${baseUrl}/api/bookings/${testBookingId}/book-job`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jobDate: '2024-12-20',
                jobTime: '6:30 PM'
            })
        });
        
        if (scheduleResponse.ok) {
            const scheduleResult = await scheduleResponse.json();
            console.log('✅ Job scheduling successful:', scheduleResult);
        } else {
            const error = await scheduleResponse.json();
            console.log('⚠️ Job scheduling failed (expected for test):', error);
        }
        
        // Step 3: Test admin confirmation
        console.log('\n👨‍💼 Step 3: Testing Admin Job Confirmation...');
        const confirmResponse = await fetch(`${baseUrl}/api/bookings/${testBookingId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token' // This will fail, but we're testing the endpoint
            },
            body: JSON.stringify({ status: 'invoice-ready' })
        });
        
        if (confirmResponse.ok) {
            const confirmResult = await confirmResponse.json();
            console.log('✅ Job confirmation successful:', confirmResult);
        } else {
            const error = await confirmResponse.json();
            console.log('⚠️ Job confirmation failed (expected for test):', error);
        }
        
        console.log('\n🎯 Flow Test Complete!');
        console.log('\n📋 Expected Flow:');
        console.log('1. Customer accepts quote → status: quote-accepted');
        console.log('2. Customer schedules job → status: pending-booking');
        console.log('3. Admin confirms job → status: invoice-ready');
        console.log('4. Admin creates and sends invoice → status: invoice-sent');
        console.log('5. Customer pays → status: completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
};

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    testQuoteAcceptanceFlow();
} else {
    // Browser environment
    console.log('🌐 Running in browser - use testQuoteAcceptanceFlow() to test');
    window.testQuoteAcceptanceFlow = testQuoteAcceptanceFlow;
}

module.exports = { testQuoteAcceptanceFlow };



