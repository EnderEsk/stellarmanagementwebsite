// Debug script to check calendar data
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function debugCalendar() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('stellartmanagement');
        
        // Check blocked dates
        console.log('\n🔍 Checking blocked dates...');
        const blockedDates = await db.collection('blocked_dates').find({}).toArray();
        console.log(`Found ${blockedDates.length} blocked dates:`);
        blockedDates.forEach(block => {
            console.log(`  ${block.date}: ${block.reason || 'no reason'}`);
        });
        
        // Check for full-day job blocks specifically
        console.log('\n🚫 Checking full-day job blocks...');
        const fullDayJobBlocks = await db.collection('blocked_dates').find({ reason: 'full_day_job' }).toArray();
        console.log(`Found ${fullDayJobBlocks.length} full-day job blocks:`);
        fullDayJobBlocks.forEach(block => {
            console.log(`  ${block.date}: Job ID ${block.job_booking_id} - ${block.note}`);
        });
        
        // Check bookings that might be creating full-day job blocks
        console.log('\n📅 Checking job bookings...');
        const jobBookings = await db.collection('bookings').find({
            status: { $in: ['pending-booking', 'invoice-ready', 'invoice-sent', 'completed'] }
        }).toArray();
        
        console.log(`Found ${jobBookings.length} job bookings:`);
        jobBookings.forEach(booking => {
            console.log(`  ${booking.booking_id}: ${booking.job_date || booking.date} at ${booking.job_time || booking.time} - ${booking.status} - ${booking.name}`);
        });
        
        // Check for September 3rd specifically
        console.log('\n🎯 Checking September 3rd, 2025 specifically...');
        const sept3Bookings = await db.collection('bookings').find({
            $or: [
                { date: '2025-09-03' },
                { job_date: '2025-09-03' }
            ]
        }).toArray();
        
        console.log(`Found ${sept3Bookings.length} bookings for September 3rd, 2025:`);
        sept3Bookings.forEach(booking => {
            console.log(`  ${booking.booking_id}: ${booking.date} (job: ${booking.job_date}) at ${booking.job_time || booking.time} - ${booking.status} - ${booking.name}`);
        });
        
        // Check blocked dates for September 3rd
        const sept3Blocked = await db.collection('blocked_dates').find({ date: '2025-09-03' }).toArray();
        console.log(`Found ${sept3Blocked.length} blocked dates for September 3rd, 2025:`);
        sept3Blocked.forEach(block => {
            console.log(`  ${block.date}: ${block.reason || 'no reason'} - ${block.note || 'no note'}`);
        });
        
        // Check availability API response for September
        console.log('\n🌐 Checking availability API for September...');
        const availabilityData = await getAvailabilityData(db, '2025-09-01', '2025-09-30');
        console.log('Availability data for September:', availabilityData);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n🔌 Disconnected from MongoDB');
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

// Run the debug function
debugCalendar().catch(console.error);
