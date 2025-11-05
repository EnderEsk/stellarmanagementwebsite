const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixInvalidDates() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('stellar_tree_management');
        const bookingsCollection = db.collection('bookings');
        
        // Find all bookings
        const allBookings = await bookingsCollection.find({}).toArray();
        console.log(`Found ${allBookings.length} total bookings`);
        
        // Check for invalid dates
        const invalidDateBookings = [];
        const validDateBookings = [];
        
        allBookings.forEach(booking => {
            if (!booking.date || typeof booking.date !== 'string') {
                invalidDateBookings.push({
                    id: booking._id,
                    booking_id: booking.booking_id,
                    date: booking.date,
                    issue: 'Missing or non-string date'
                });
                return;
            }
            
            // Check if date is in valid format (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(booking.date)) {
                invalidDateBookings.push({
                    id: booking._id,
                    booking_id: booking.booking_id,
                    date: booking.date,
                    issue: 'Invalid date format (not YYYY-MM-DD)'
                });
                return;
            }
            
            // Check if date is actually valid
            const date = new Date(booking.date);
            if (isNaN(date.getTime())) {
                invalidDateBookings.push({
                    id: booking._id,
                    booking_id: booking.booking_id,
                    date: booking.date,
                    issue: 'Invalid date value'
                });
                return;
            }
            
            validDateBookings.push(booking);
        });
        
        console.log(`\n📊 Date Analysis Results:`);
        console.log(`✅ Valid dates: ${validDateBookings.length}`);
        console.log(`❌ Invalid dates: ${invalidDateBookings.length}`);
        
        if (invalidDateBookings.length > 0) {
            console.log(`\n🔍 Bookings with invalid dates:`);
            invalidDateBookings.forEach(booking => {
                console.log(`- Booking ID: ${booking.booking_id}, Date: "${booking.date}", Issue: ${booking.issue}`);
            });
            
            // Ask if user wants to fix them
            console.log(`\n🛠️  To fix these bookings, you can:`);
            console.log(`1. Set a default date (today's date)`);
            console.log(`2. Delete the invalid bookings`);
            console.log(`3. Manually update them in the database`);
            
            // For now, let's set them to today's date
            const today = new Date().toISOString().split('T')[0];
            console.log(`\n🔧 Setting invalid dates to today (${today})...`);
            
            for (const booking of invalidDateBookings) {
                await bookingsCollection.updateOne(
                    { _id: booking.id },
                    { $set: { date: today } }
                );
                console.log(`✅ Fixed booking ${booking.booking_id}`);
            }
            
            console.log(`\n✅ Fixed ${invalidDateBookings.length} bookings with invalid dates`);
        } else {
            console.log(`\n✅ All bookings have valid dates!`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

// Run the fix
fixInvalidDates().catch(console.error);