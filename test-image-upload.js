require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function testImageUpload() {
    try {
        const fetch = (await import('node-fetch')).default;
        const FormData = (await import('form-data')).default;
        
        console.log('🔍 Testing image upload...');
        
        // Create a test image (1x1 pixel PNG)
        const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        
        // Create form data
        const form = new FormData();
        
        // Add booking data
        form.append('service', 'Test Service');
        form.append('date', '2025-08-10');
        form.append('time', '9:00 AM');
        form.append('name', 'Test Customer');
        form.append('email', 'test@example.com');
        form.append('phone', '555-1234');
        form.append('address', '123 Test St');
        form.append('notes', 'Test booking with images');
        
        // Add test image
        form.append('images', testImageBuffer, {
            filename: 'test-image.png',
            contentType: 'image/png'
        });
        
        console.log('📤 Sending booking with image...');
        
        const response = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            body: form,
            headers: {
                ...form.getHeaders()
            }
        });
        
        console.log(`📊 Response status: ${response.status}`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Booking created successfully:', result);
            
            // Now test if we can retrieve the booking with images
            console.log('\n🔍 Testing booking retrieval...');
            const getResponse = await fetch('http://localhost:3000/api/bookings', {
                headers: {
                    'x-admin-auth': 'stellar2024',
                    'Content-Type': 'application/json'
                }
            });
            
            if (getResponse.ok) {
                const bookings = await getResponse.json();
                const newBooking = bookings.find(b => b.booking_id === result.bookingId);
                
                if (newBooking) {
                    console.log('📊 New booking found:');
                    console.log(`  • Booking ID: ${newBooking.booking_id}`);
                    console.log(`  • Images field: ${newBooking.images}`);
                    
                    if (newBooking.images) {
                        try {
                            const images = JSON.parse(newBooking.images);
                            console.log(`  • Parsed images:`, images);
                            
                            // Test image URL
                            if (images.length > 0) {
                                console.log(`  • Testing image URL: ${images[0]}`);
                                const imageResponse = await fetch(`http://localhost:3000${images[0]}`);
                                console.log(`  • Image response status: ${imageResponse.status}`);
                            }
                        } catch (e) {
                            console.error('❌ Error parsing images:', e);
                        }
                    }
                }
            }
        } else {
            const errorText = await response.text();
            console.log(`❌ Error: ${errorText}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testImageUpload(); 