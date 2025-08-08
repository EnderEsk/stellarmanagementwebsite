const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set!');
    process.exit(1);
}

async function migrateImages() {
    let client;
    
    try {
        console.log('🔗 Connecting to MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db('stellartmanagement');
        const bookingsCollection = db.collection('bookings');
        const imagesCollection = db.collection('images');
        
        console.log('📋 Finding bookings with old filesystem image paths...');
        
        // Find bookings with old filesystem paths
        const bookings = await bookingsCollection.find({
            images: { $ne: null, $ne: '' },
            images: { $regex: /^\[.*\/uploads\/booking-.*\]$/ }
        }).toArray();
        
        console.log(`Found ${bookings.length} bookings with old image paths`);
        
        if (bookings.length === 0) {
            console.log('✅ No bookings found with old image paths. Migration not needed.');
            return;
        }
        
        let migratedCount = 0;
        let errorCount = 0;
        
        for (const booking of bookings) {
            try {
                console.log(`\n🔄 Processing booking: ${booking.booking_id}`);
                
                // Parse the old image paths
                const oldImagePaths = JSON.parse(booking.images);
                const newImagePaths = [];
                
                for (const oldPath of oldImagePaths) {
                    // Extract filename from old path
                    const filename = path.basename(oldPath);
                    console.log(`  📁 Looking for file: ${filename}`);
                    
                    // Check if the file exists in the uploads directory
                    const filePath = path.join(__dirname, 'uploads', filename);
                    
                    if (fs.existsSync(filePath)) {
                        // Read the file
                        const fileBuffer = fs.readFileSync(filePath);
                        const fileStats = fs.statSync(filePath);
                        
                        // Create new MongoDB image record
                        const imageId = new ObjectId();
                        const newImageRecord = {
                            _id: imageId,
                            bookingId: booking.booking_id,
                            filename: filename,
                            contentType: getContentType(filename),
                            size: fileStats.size,
                            data: fileBuffer,
                            uploadedAt: new Date(),
                            migrated: true
                        };
                        
                        // Insert into MongoDB
                        await imagesCollection.insertOne(newImageRecord);
                        
                        // Create new path
                        const newPath = `/uploads/${imageId}`;
                        newImagePaths.push(newPath);
                        
                        console.log(`  ✅ Migrated: ${filename} -> ${imageId}`);
                        
                        // Optionally delete the old file
                        // fs.unlinkSync(filePath);
                        // console.log(`  🗑️ Deleted old file: ${filename}`);
                    } else {
                        console.log(`  ❌ File not found: ${filename}`);
                        // Keep the old path for now, but mark it as unavailable
                        newImagePaths.push(oldPath);
                    }
                }
                
                // Update the booking with new image paths
                await bookingsCollection.updateOne(
                    { _id: booking._id },
                    { $set: { images: JSON.stringify(newImagePaths) } }
                );
                
                console.log(`  ✅ Updated booking with ${newImagePaths.length} images`);
                migratedCount++;
                
            } catch (error) {
                console.error(`❌ Error processing booking ${booking.booking_id}:`, error);
                errorCount++;
            }
        }
        
        console.log(`\n🎉 Migration completed!`);
        console.log(`✅ Successfully migrated: ${migratedCount} bookings`);
        console.log(`❌ Errors: ${errorCount} bookings`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Disconnected from MongoDB');
        }
    }
}

function getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    };
    return contentTypes[ext] || 'application/octet-stream';
}

// Run the migration
migrateImages().catch(console.error); 