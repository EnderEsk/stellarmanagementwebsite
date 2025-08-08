require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function addImagesToBooking() {
    try {
        console.log('🔍 Adding test images to existing booking...');
        
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('stellartmanagement');
        
        // Get the first booking
        const booking = await db.collection('bookings').findOne({});
        
        if (!booking) {
            console.log('❌ No bookings found in database');
            return;
        }
        
        console.log(`📊 Found booking: ${booking.booking_id}`);
        console.log(`📊 Current images: ${booking.images}`);
        
        // Create test images (1x1 pixel PNGs)
        const testImage1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        const testImage2 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        
        // Store images in MongoDB
        const imageIds = [];
        
        for (let i = 1; i <= 2; i++) {
            const imageId = new ObjectId();
            await db.collection('images').insertOne({
                _id: imageId,
                bookingId: booking.booking_id,
                filename: `test-image-${i}.png`,
                contentType: 'image/png',
                size: testImage1.length,
                data: new require('mongodb').Binary(testImage1),
                uploadedAt: new Date()
            });
            
            const urlPath = `/uploads/${imageId}`;
            imageIds.push(urlPath);
            
            console.log(`✅ Stored image ${i}: ${urlPath}`);
        }
        
        // Update the booking with the new images
        const imagesJson = JSON.stringify(imageIds);
        await db.collection('bookings').updateOne(
            { booking_id: booking.booking_id },
            { $set: { images: imagesJson } }
        );
        
        console.log(`✅ Updated booking ${booking.booking_id} with images: ${imagesJson}`);
        
        // Verify the update
        const updatedBooking = await db.collection('bookings').findOne({ booking_id: booking.booking_id });
        console.log(`📊 Updated booking images: ${updatedBooking.images}`);
        
        await client.close();
        console.log('✅ Database connection closed');
        
        console.log('\n🎯 Next steps:');
        console.log('1. Refresh your admin panel');
        console.log('2. You should now see images for this booking');
        console.log('3. The images will be served from MongoDB');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

addImagesToBooking(); 