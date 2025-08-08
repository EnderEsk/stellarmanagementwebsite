require('dotenv').config();
const { MongoClient, ObjectId, Binary } = require('mongodb');

async function createTestBooking() {
    try {
        console.log('🔍 Creating test booking with images...');
        
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('stellartmanagement');
        
        // Create a test booking
        const bookingId = 'ST-TEST-' + Date.now().toString(36).toUpperCase();
        const customerId = 'CUST-TEST-' + Date.now().toString(36).toUpperCase();
        
        // Create test images (1x1 pixel PNGs)
        const testImage1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        const testImage2 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        
        // Store images in MongoDB
        const imageIds = [];
        
        for (let i = 1; i <= 2; i++) {
            const imageId = new ObjectId();
            await db.collection('images').insertOne({
                _id: imageId,
                bookingId: bookingId,
                filename: `test-image-${i}.png`,
                contentType: 'image/png',
                size: testImage1.length,
                data: new Binary(testImage1),
                uploadedAt: new Date()
            });
            
            const urlPath = `/uploads/${imageId}`;
            imageIds.push(urlPath);
            
            console.log(`✅ Stored image ${i}: ${urlPath}`);
        }
        
        // Create customer
        const customer = {
            customer_id: customerId,
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '555-1234',
            address: '123 Test Street',
            total_bookings: 1,
            total_spent: 0,
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        
        await db.collection('customers').insertOne(customer);
        console.log(`✅ Created customer: ${customerId}`);
        
        // Create booking with images
        const booking = {
            booking_id: bookingId,
            customer_id: customerId,
            service: 'Tree Removal',
            date: '2025-08-10',
            time: '9:00 AM',
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '555-1234',
            address: '123 Test Street',
            notes: 'Test booking with images',
            images: JSON.stringify(imageIds),
            status: 'pending',
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        
        await db.collection('bookings').insertOne(booking);
        console.log(`✅ Created booking: ${bookingId}`);
        console.log(`📊 Images: ${booking.images}`);
        
        await client.close();
        console.log('✅ Database connection closed');
        
        console.log('\n🎯 Test booking created successfully!');
        console.log(`📊 Booking ID: ${bookingId}`);
        console.log(`📊 Customer ID: ${customerId}`);
        console.log(`📊 Images: ${imageIds.length} images stored`);
        console.log('\n📝 Next steps:');
        console.log('1. Refresh your admin panel');
        console.log('2. You should see the new booking with images');
        console.log('3. The images will be displayed in the admin panel');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

createTestBooking(); 