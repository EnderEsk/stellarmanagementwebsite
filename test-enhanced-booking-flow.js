#!/usr/bin/env node

/**
 * Enhanced Booking Flow Test Script
 * 
 * This script helps test the new booking flow:
 * Request Quote → Request Booking → Confirmed Booking
 */

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'aiplanet100@gmail.com'; // Update with your admin email

// Test data
const testBooking = {
    service: 'Tree Trimming',
    date: '2024-01-15',
    time: '09:00',
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '555-1234',
    address: '123 Test Street, Test City'
};

let createdBookingId = null;

// Utility functions
async function makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || `HTTP ${response.status}`);
        }
        
        return result;
    } catch (error) {
        console.error(`❌ Request failed: ${error.message}`);
        throw error;
    }
}

// Test functions
async function testCreateBooking() {
    console.log('\n📝 Testing booking creation...');
    
    try {
        const result = await makeRequest('/api/bookings', 'POST', testBooking);
        createdBookingId = result.bookingId;
        console.log(`✅ Booking created successfully: ${createdBookingId}`);
        return result;
    } catch (error) {
        console.error('❌ Failed to create booking:', error.message);
        throw error;
    }
}

async function testGetBooking() {
    console.log('\n📖 Testing booking retrieval...');
    
    if (!createdBookingId) {
        throw new Error('No booking ID available');
    }
    
    try {
        const booking = await makeRequest(`/api/bookings/${createdBookingId}`);
        console.log(`✅ Booking retrieved successfully`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Service: ${booking.service}`);
        console.log(`   Customer: ${booking.name}`);
        return booking;
    } catch (error) {
        console.error('❌ Failed to retrieve booking:', error.message);
        throw error;
    }
}

async function testUpdateStatus(newStatus) {
    console.log(`\n🔄 Testing status update to "${newStatus}"...`);
    
    if (!createdBookingId) {
        throw new Error('No booking ID available');
    }
    
    try {
        const result = await makeRequest(
            `/api/bookings/${createdBookingId}/status`,
            'PATCH',
            { status: newStatus },
            { 'Authorization': `Bearer ${ADMIN_EMAIL}` }
        );
        console.log(`✅ Status updated to "${newStatus}" successfully`);
        return result;
    } catch (error) {
        console.error('❌ Failed to update status:', error.message);
        throw error;
    }
}

async function testSendBookingEmail() {
    console.log('\n📧 Testing booking email...');
    
    if (!createdBookingId) {
        throw new Error('No booking ID available');
    }
    
    try {
        const result = await makeRequest(
            `/api/bookings/${createdBookingId}/send-booking-email`,
            'POST',
            {
                bookingId: createdBookingId,
                customerEmail: testBooking.email,
                customerName: testBooking.name
            },
            { 'Authorization': `Bearer ${ADMIN_EMAIL}` }
        );
        console.log('✅ Booking email sent successfully');
        console.log('   Check console logs for email content');
        return result;
    } catch (error) {
        console.error('❌ Failed to send booking email:', error.message);
        throw error;
    }
}

async function testCustomerConfirmation() {
    console.log('\n✅ Testing customer confirmation...');
    
    if (!createdBookingId) {
        throw new Error('No booking ID available');
    }
    
    try {
        const result = await makeRequest(
            `/api/bookings/${createdBookingId}/confirm`,
            'POST'
        );
        console.log('✅ Customer confirmation successful');
        return result;
    } catch (error) {
        console.error('❌ Failed customer confirmation:', error.message);
        throw error;
    }
}

async function testGetStatistics() {
    console.log('\n📊 Testing statistics...');
    
    try {
        const stats = await makeRequest('/api/bookings/stats/overview');
        console.log('✅ Statistics retrieved successfully');
        console.log(`   Request Quote (pending): ${stats.pending_bookings || 0}`);
        console.log(`   Request Booking (confirmed): ${stats.confirmed_bookings || 0}`);
        console.log(`   Booking Pending: ${stats.pending_booking_bookings || 0}`);
        console.log(`   Confirmed Booking: ${stats.completed_bookings || 0}`);
        console.log(`   Cancelled: ${stats.cancelled_bookings || 0}`);
        return stats;
    } catch (error) {
        console.error('❌ Failed to get statistics:', error.message);
        throw error;
    }
}

async function testBookingStatusPage() {
    console.log('\n🌐 Testing booking status page...');
    
    if (!createdBookingId) {
        throw new Error('No booking ID available');
    }
    
    try {
        const response = await fetch(`${BASE_URL}/${createdBookingId}`);
        if (response.ok) {
            console.log('✅ Booking status page accessible');
            console.log(`   URL: ${BASE_URL}/${createdBookingId}`);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Failed to access booking status page:', error.message);
        throw error;
    }
}

// Main test flow
async function runTests() {
    console.log('🚀 Starting Enhanced Booking Flow Tests');
    console.log('=====================================');
    
    try {
        // Test 1: Create booking
        await testCreateBooking();
        
        // Test 2: Get booking details
        await testGetBooking();
        
        // Test 3: Get initial statistics
        await testGetStatistics();
        
        // Test 4: Update status to confirmed (Request Booking)
        await testUpdateStatus('confirmed');
        
        // Test 5: Send booking email
        await testSendBookingEmail();
        
        // Test 6: Test booking status page accessibility
        await testBookingStatusPage();
        
        // Test 7: Customer confirms booking (creates pending-booking status)
        await testCustomerConfirmation();
        
        // Test 8: Get statistics after customer confirmation
        await testGetStatistics();
        
        // Test 9: Admin confirms booking (pending-booking to completed)
        await testUpdateStatus('completed');
        
        // Test 10: Get final statistics
        await testGetStatistics();
        
        // Test 11: Get final booking details
        await testGetBooking();
        
        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   Booking ID: ${createdBookingId}`);
        console.log(`   Status Page: ${BASE_URL}/${createdBookingId}`);
        console.log(`   Admin Panel: ${BASE_URL}/admin.html`);
        
    } catch (error) {
        console.error('\n💥 Test suite failed:', error.message);
        process.exit(1);
    }
}

// Manual testing helpers
async function manualTestFlow() {
    console.log('\n🔧 Manual Testing Commands:');
    console.log('==========================');
    console.log('\n1. Start the server:');
    console.log('   node server.js');
    
    console.log('\n2. Access admin panel:');
    console.log(`   ${BASE_URL}/admin.html`);
    
    if (createdBookingId) {
        console.log('\n3. Test booking status page:');
        console.log(`   ${BASE_URL}/${createdBookingId}`);
        
        console.log('\n4. Test API endpoints:');
        console.log(`   GET ${BASE_URL}/api/bookings/${createdBookingId}`);
        console.log(`   PATCH ${BASE_URL}/api/bookings/${createdBookingId}/status`);
        console.log(`   POST ${BASE_URL}/api/bookings/${createdBookingId}/send-booking-email`);
        console.log(`   POST ${BASE_URL}/api/bookings/${createdBookingId}/confirm`);
    }
    
    console.log('\n5. Check console logs for email content');
    console.log('\n6. Test mobile responsiveness in browser dev tools');
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Enhanced Booking Flow Test Script

Usage:
  node test-enhanced-booking-flow.js [options]

Options:
  --help, -h     Show this help message
  --manual       Show manual testing commands
  --booking-id   Test with existing booking ID

Examples:
  node test-enhanced-booking-flow.js
  node test-enhanced-booking-flow.js --manual
  node test-enhanced-booking-flow.js --booking-id BOOKING123
        `);
        process.exit(0);
    }
    
    if (args.includes('--manual')) {
        manualTestFlow();
        process.exit(0);
    }
    
    const bookingIdIndex = args.indexOf('--booking-id');
    if (bookingIdIndex !== -1 && args[bookingIdIndex + 1]) {
        createdBookingId = args[bookingIdIndex + 1];
        console.log(`Using existing booking ID: ${createdBookingId}`);
    }
    
    runTests();
}

module.exports = {
    testCreateBooking,
    testGetBooking,
    testUpdateStatus,
    testSendBookingEmail,
    testCustomerConfirmation,
    testGetStatistics,
    testBookingStatusPage,
    runTests
}; 