// Script to migrate existing bookings from old time values to new time values
// This script updates the database to change:
// 8:00 AM -> 5:30 PM
// 1:00 PM -> 6:30 PM  
// 4:00 PM -> 7:30 PM

require('dotenv').config();

// Check if environment variables are loaded
if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set!');
    console.error('Please ensure your .env file contains MONGODB_URI');
    process.exit(1);
}

const { connectToDatabase, getDatabase, closeConnection } = require('./database');

// Time mapping for migration - handle both full and abbreviated formats
const TIME_MAPPING = {
    // Full formats
    '8:00 AM': '5:30 PM',
    '1:00 PM': '6:30 PM',
    '4:00 PM': '7:30 PM',
    // Abbreviated formats
    '8am': '5:30 PM',
    '1pm': '6:30 PM',
    '4pm': '7:30 PM',
    // 24-hour format variations
    '8:00': '5:30 PM',
    '13:00': '6:30 PM',
    '16:00': '7:30 PM',
    '08:00': '5:30 PM',
    '13:00': '6:30 PM',
    '16:00': '7:30 PM'
};

async function migrateBookingTimes() {
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        const db = await connectToDatabase();
        const bookingsCollection = db.collection('bookings');
        
        console.log('📊 Connected to database: stellartmanagement');
        
        // Find all bookings with old time values
        const oldTimeBookings = await bookingsCollection.find({
            time: { $in: Object.keys(TIME_MAPPING) }
        }).toArray();
        
        console.log(`📋 Found ${oldTimeBookings.length} bookings with old time values`);
        
        if (oldTimeBookings.length === 0) {
            console.log('✅ No bookings need migration. All times are already updated.');
            return;
        }
        
        // Display bookings that will be migrated
        console.log('\n📝 Bookings to be migrated:');
        oldTimeBookings.forEach(booking => {
            console.log(`  - ID: ${booking._id}, Date: ${booking.date}, Old Time: ${booking.time} -> New Time: ${TIME_MAPPING[booking.time]}`);
        });
        
        // Perform the migration
        console.log('\n🔄 Starting migration...');
        
        for (const booking of oldTimeBookings) {
            const newTime = TIME_MAPPING[booking.time];
            
            const result = await bookingsCollection.updateOne(
                { _id: booking._id },
                { $set: { time: newTime } }
            );
            
            if (result.modifiedCount > 0) {
                console.log(`✅ Updated booking ${booking._id}: ${booking.time} -> ${newTime}`);
            } else {
                console.log(`❌ Failed to update booking ${booking._id}`);
            }
        }
        
        // Verify the migration
        console.log('\n🔍 Verifying migration...');
        const remainingOldBookings = await bookingsCollection.find({
            time: { $in: Object.keys(TIME_MAPPING) }
        }).toArray();
        
        if (remainingOldBookings.length === 0) {
            console.log('✅ Migration successful! All old time values have been updated.');
        } else {
            console.log(`❌ Migration incomplete. ${remainingOldBookings.length} bookings still have old time values.`);
        }
        
        // Show summary of new time distribution
        const newTimeBookings = await bookingsCollection.find({
            time: { $in: Object.values(TIME_MAPPING) }
        }).toArray();
        
        console.log('\n📊 New time distribution:');
        Object.values(TIME_MAPPING).forEach(newTime => {
            const count = newTimeBookings.filter(b => b.time === newTime).length;
            console.log(`  - ${newTime}: ${count} bookings`);
        });
        
    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    } finally {
        await closeConnection();
        console.log('🔌 Database connection closed');
    }
}

// Run the migration if this script is executed directly
if (require.main === module) {
    migrateBookingTimes()
        .then(() => {
            console.log('\n🎉 Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateBookingTimes };
