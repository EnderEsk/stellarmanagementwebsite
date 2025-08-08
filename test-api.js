async function testAPI() {
    try {
        const fetch = (await import('node-fetch')).default;
        
        console.log('🔍 Testing API endpoints...');
        
        // Test the bookings endpoint with admin auth
        const response = await fetch('http://localhost:3000/api/bookings', {
            headers: {
                'x-admin-auth': 'stellar2024',
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Response status: ${response.status}`);
        console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const data = await response.json();
            console.log(`📊 Total bookings returned: ${data.length}`);
            
            if (data.length > 0) {
                console.log('\n🔍 Sample booking:');
                const sample = data[0];
                console.log(`  • Booking ID: ${sample.booking_id}`);
                console.log(`  • Images field: ${sample.images}`);
                console.log(`  • Status: ${sample.status}`);
                console.log(`  • Date: ${sample.date}`);
            }
        } else {
            const errorText = await response.text();
            console.log(`❌ Error response: ${errorText}`);
        }
        
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

testAPI(); 