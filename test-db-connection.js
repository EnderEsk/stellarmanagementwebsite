require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testDBConnection() {
    try {
        console.log('🔍 Testing database connection...');
        console.log('MONGODB_URI:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 50) + '...' : 'NOT SET');
        
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('stellartmanagement');
        console.log('📊 Database name:', db.databaseName);
        
        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('📋 Collections:', collections.map(c => c.name));
        
        // Check bookings collection
        const bookings = await db.collection('bookings').find({}).toArray();
        console.log(`📊 Bookings count: ${bookings.length}`);
        
        if (bookings.length > 0) {
            console.log('\n🔍 Sample booking:');
            const sample = bookings[0];
            console.log(`  • Booking ID: ${sample.booking_id}`);
            console.log(`  • Images: ${sample.images}`);
            console.log(`  • Status: ${sample.status}`);
        }
        
        // Check images collection
        const images = await db.collection('images').find({}).toArray();
        console.log(`📸 Images count: ${images.length}`);
        
        await client.close();
        console.log('✅ Connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testDBConnection(); 