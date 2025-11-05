const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set!');
    process.exit(1);
}

async function fixImagePaths() {
    let client;
    
    try {
        console.log('🔗 Connecting to MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db('stellartmanagement');
        const bookingsCollection = db.collection('bookings');
        
        console.log('📋 Finding bookings with old filesystem image paths...');
        
        // Find bookings with old filesystem paths
        const bookings = await bookingsCollection.find({
            images: { $ne: null, $ne: '' },
            images: { $regex: /booking-.*\.(jpg|jpeg|png|gif|webp)/ }
        }).toArray();
        
        console.log(`Found ${bookings.length} bookings with old image paths`);
        
        if (bookings.length === 0) {
            console.log('✅ No bookings found with old image paths.');
            return;
        }
        
        let updatedCount = 0;
        
        for (const booking of bookings) {
            try {
                console.log(`\n🔄 Processing booking: ${booking.booking_id}`);
                console.log(`  Old images: ${booking.images}`);
                
                // Parse the old image paths
                const oldImagePaths = JSON.parse(booking.images);
                const newImagePaths = [];
                
                for (const oldPath of oldImagePaths) {
                    // Extract filename from old path
                    const filename = oldPath.split('/').pop();
                    
                    // Create a new MongoDB ObjectId for this image
                    const imageId = new ObjectId();
                    
                    // Create new path
                    const newPath = `/uploads/${imageId}`;
                    newImagePaths.push(newPath);
                    
                    console.log(`  📁 Converted: ${filename} -> ${imageId}`);
                }
                
                // Update the booking with new image paths
                await bookingsCollection.updateOne(
                    { _id: booking._id },
                    { $set: { images: JSON.stringify(newImagePaths) } }
                );
                
                console.log(`  ✅ Updated booking with ${newImagePaths.length} new image paths`);
                updatedCount++;
                
            } catch (error) {
                console.error(`❌ Error processing booking ${booking.booking_id}:`, error);
            }
        }
        
        console.log(`\n🎉 Image path conversion completed!`);
        console.log(`✅ Successfully updated: ${updatedCount} bookings`);
        
        // Show sample of updated bookings
        const updatedBookings = await bookingsCollection.find({
            images: { $ne: null, $ne: '' },
            images: { $regex: /\/uploads\/[a-f0-9]{24}/ }
        }).limit(3).toArray();
        
        if (updatedBookings.length > 0) {
            console.log('\n📸 Sample updated bookings:');
            updatedBookings.forEach(booking => {
                console.log(`  ${booking.booking_id}: ${booking.images}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Fix failed:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Disconnected from MongoDB');
        }
    }
}

// Run the fix
fixImagePaths().catch(console.error); 