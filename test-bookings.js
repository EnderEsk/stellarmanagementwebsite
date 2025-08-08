require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testBookings() {
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db();
        
        // Check bookings collection
        const bookings = await db.collection('bookings').find({}).toArray();
        console.log(`📊 Total bookings in database: ${bookings.length}`);
        
        if (bookings.length > 0) {
            console.log('\n🔍 Sample booking data:');
            const sample = bookings[0];
            console.log(`  • Booking ID: ${sample.booking_id}`);
            console.log(`  • Images field: ${sample.images}`);
            console.log(`  • Images field type: ${typeof sample.images}`);
            console.log(`  • Status: ${sample.status}`);
            console.log(`  • Date: ${sample.date}`);
            
            if (sample.images) {
                try {
                    const parsed = JSON.parse(sample.images);
                    console.log(`  • Parsed images:`, parsed);
                    console.log(`  • Images array length: ${parsed.length}`);
                } catch (e) {
                    console.log(`  • Error parsing images: ${e.message}`);
                }
            }
        }
        
        // Check images collection
        const images = await db.collection('images').find({}).toArray();
        console.log(`\n📸 Total images in database: ${images.length}`);
        
        if (images.length > 0) {
            console.log('\n🔍 Sample image data:');
            const sample = images[0];
            console.log(`  • Image ID: ${sample._id}`);
            console.log(`  • Booking ID: ${sample.bookingId}`);
            console.log(`  • Filename: ${sample.filename}`);
            console.log(`  • Size: ${sample.size} bytes`);
        }
        
        await client.close();
        console.log('\n✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testBookings(); 