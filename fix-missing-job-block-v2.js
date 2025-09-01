// Improved script to fix missing full-day job block for September 3rd, 2025
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixMissingJobBlockV2() {
    let client;
    
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log('MongoDB URI preview:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 50) + '...' : 'NOT FOUND');
        
        client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('stellartmanagement');
        console.log('📊 Using database: stellartmanagement');
        
        // List all collections to verify we're in the right place
        console.log('\n📋 Available collections:');
        const collections = await db.listCollections().toArray();
        collections.forEach(col => console.log(`  - ${col.name}`));
        
        // Check if the job booking exists
        console.log('\n🔍 Checking for job booking on September 3rd, 2025...');
        const jobBooking = await db.collection('bookings').findOne({
            $or: [
                { date: '2025-09-03' },
                { job_date: '2025-09-03' }
            ],
            status: { $in: ['pending-booking', 'invoice-ready', 'invoice-sent', 'completed'] }
        });
        
        if (!jobBooking) {
            console.log('❌ No job booking found for September 3rd, 2025');
            return;
        }
        
        console.log(`✅ Found job booking: ${jobBooking.booking_id} - ${jobBooking.name} - ${jobBooking.status}`);
        console.log(`   Date: ${jobBooking.job_date || jobBooking.date} at ${jobBooking.job_time || jobBooking.time}`);
        console.log(`   Service: ${jobBooking.service}`);
        console.log(`   Full booking object:`, JSON.stringify(jobBooking, null, 2));
        
        // Check if full-day job block already exists
        console.log('\n🚫 Checking for existing full-day job block...');
        const existingBlock = await db.collection('blocked_dates').findOne({
            date: '2025-09-03',
            reason: 'full_day_job'
        });
        
        if (existingBlock) {
            console.log('✅ Full-day job block already exists for September 3rd, 2025');
            console.log(`   Block ID: ${existingBlock._id}`);
            console.log(`   Job Booking ID: ${existingBlock.job_booking_id}`);
            console.log(`   Note: ${existingBlock.note}`);
            return;
        }
        
        // Check all blocked dates to see what's there
        console.log('\n🔍 Current blocked dates:');
        const allBlockedDates = await db.collection('blocked_dates').find({}).toArray();
        console.log(`Found ${allBlockedDates.length} blocked dates:`);
        allBlockedDates.forEach(block => {
            console.log(`  ${block.date}: ${block.reason || 'no reason'} - ${block.note || 'no note'}`);
        });
        
        // Create the missing full-day job block
        console.log('\n🔧 Creating missing full-day job block...');
        const jobDate = jobBooking.job_date || jobBooking.date;
        const jobTime = jobBooking.job_time || jobBooking.time;
        
        const blockData = {
            date: jobDate,
            reason: 'full_day_job',
            blocked_at: new Date(),
            job_booking_id: jobBooking.booking_id,
            note: `Full day blocked due to job scheduled at ${jobTime} for ${jobBooking.name}`
        };
        
        console.log('Inserting block data:', JSON.stringify(blockData, null, 2));
        
        const blockResult = await db.collection('blocked_dates').insertOne(blockData);
        
        console.log(`✅ Successfully created full-day job block:`);
        console.log(`   Block ID: ${blockResult.insertedId}`);
        console.log(`   Date: ${jobDate}`);
        console.log(`   Job Booking ID: ${jobBooking.booking_id}`);
        console.log(`   Customer: ${jobBooking.name}`);
        console.log(`   Service: ${jobBooking.service}`);
        
        // Verify the block was created by querying again
        console.log('\n🔍 Verifying block was created...');
        const newBlock = await db.collection('blocked_dates').findOne({
            _id: blockResult.insertedId
        });
        
        if (newBlock) {
            console.log('✅ Block verification successful');
            console.log(`   Date: ${newBlock.date}`);
            console.log(`   Reason: ${newBlock.reason}`);
            console.log(`   Job Booking ID: ${newBlock.job_booking_id}`);
            console.log(`   Full block object:`, JSON.stringify(newBlock, null, 2));
        } else {
            console.log('❌ Block verification failed - block not found after creation');
        }
        
        // Check all blocked dates again to confirm the new one is there
        console.log('\n🔍 Checking all blocked dates after creation...');
        const updatedBlockedDates = await db.collection('blocked_dates').find({}).toArray();
        console.log(`Now found ${updatedBlockedDates.length} blocked dates:`);
        updatedBlockedDates.forEach(block => {
            console.log(`  ${block.date}: ${block.reason || 'no reason'} - ${block.note || 'no note'}`);
        });
        
        // Test the availability API logic directly
        console.log('\n🌐 Testing availability API logic directly...');
        const availabilityData = await getAvailabilityData(db, '2025-09-01', '2025-09-30');
        
        if (availabilityData['2025-09-03'] && availabilityData['2025-09-03'].full_day_job) {
            console.log('✅ Availability logic correctly shows September 3rd as full-day job blocked');
            console.log('   Data:', JSON.stringify(availabilityData['2025-09-03'], null, 2));
        } else {
            console.log('❌ Availability logic still not showing September 3rd as blocked');
            console.log('   Full availability data:', JSON.stringify(availabilityData, null, 2));
        }
        
        // Test the blocked dates API endpoint logic
        console.log('\n🌐 Testing blocked dates API endpoint logic...');
        const blockedDatesForAPI = await db.collection('blocked_dates')
            .find({})
            .sort({ date: 1 })
            .toArray();
        
        const formattedDates = blockedDatesForAPI.map(row => ({
            date: row.date,
            reason: row.reason
        }));
        
        console.log('Blocked dates API would return:', JSON.stringify(formattedDates, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Error stack:', error.stack);
    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 Disconnected from MongoDB');
        }
    }
}

async function getAvailabilityData(db, startDate, endDate) {
    try {
        // Get bookings for the date range
        const bookings = await db.collection('bookings')
            .find({
                date: { $gte: startDate, $lte: endDate },
                status: { $in: ['pending', 'quote-ready', 'quote-sent', 'quote-accepted', 'confirmed', 'pending-booking'] }
            })
            .sort({ date: 1, time: 1 })
            .toArray();
        
        // Group by date and time slot
        const availability = {};
        bookings.forEach(booking => {
            if (!availability[booking.date]) {
                availability[booking.date] = {};
            }
            if (!availability[booking.date][booking.time]) {
                availability[booking.date][booking.time] = 0;
            }
            availability[booking.date][booking.time]++;
        });
        
        // Also include blocked dates
        const blockedDates = await db.collection('blocked_dates')
            .find({
                date: { $gte: startDate, $lte: endDate }
            })
            .toArray();
        
        // Add blocked dates to availability data
        blockedDates.forEach(blocked => {
            if (blocked.reason !== 'unblocked_weekend') {
                if (!availability[blocked.date]) {
                    availability[blocked.date] = {};
                }
                
                if (blocked.reason === 'full_day_job') {
                    availability[blocked.date]['blocked'] = true;
                    availability[blocked.date]['full_day_job'] = true;
                    availability[blocked.date]['job_booking_id'] = blocked.job_booking_id;
                } else {
                    availability[blocked.date]['blocked'] = true;
                }
            }
        });
        
        return availability;
    } catch (error) {
        console.error('Error getting availability data:', error);
        return {};
    }
}

// Run the fix function
fixMissingJobBlockV2().catch(console.error);
