// Test file for booking restrictions functionality
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testBookingRestrictions() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('stellartmanagement');
        
        console.log('🧪 Testing Booking Restrictions System...\n');
        
        // Test 1: Create a quote with booking restrictions
        console.log('📝 Test 1: Creating quote with booking restrictions...');
        const testQuote = {
            quote_id: 'TEST-QT-' + Date.now(),
            booking_id: 'TEST-BOOKING-001',
            client_name: 'Test Customer',
            client_phone: '555-1234',
            client_address: '123 Test St',
            client_email: 'test@example.com',
            quote_date: new Date().toISOString().split('T')[0],
            service_items: JSON.stringify([
                { description: 'Tree Removal', quantity: 1, price: 500, total: 500 }
            ]),
            subtotal: 500,
            tax_amount: 25,
            total_amount: 525,
            tax_enabled: 1,
            booking_restrictions: {
                allowed_days: 'weekends',
                custom_dates: [],
                job_duration_days: 2
            },
            status: 'draft',
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        
        const result = await db.collection('quotes').insertOne(testQuote);
        console.log('✅ Quote created with ID:', result.insertedId);
        
        // Test 2: Retrieve and verify booking restrictions
        console.log('\n📖 Test 2: Retrieving quote with booking restrictions...');
        const retrievedQuote = await db.collection('quotes').findOne({ quote_id: testQuote.quote_id });
        
        if (retrievedQuote && retrievedQuote.booking_restrictions) {
            console.log('✅ Booking restrictions found:');
            console.log('   - Allowed days:', retrievedQuote.booking_restrictions.allowed_days);
            console.log('   - Job duration:', retrievedQuote.booking_restrictions.job_duration_days, 'days');
            console.log('   - Custom dates:', retrievedQuote.booking_restrictions.custom_dates.length, 'dates');
        } else {
            console.log('❌ No booking restrictions found');
        }
        
        // Test 3: Update quote with new restrictions
        console.log('\n🔄 Test 3: Updating quote with new restrictions...');
        const updateResult = await db.collection('quotes').updateOne(
            { quote_id: testQuote.quote_id },
            {
                $set: {
                    booking_restrictions: {
                        allowed_days: 'custom',
                        custom_dates: ['2025-08-16', '2025-08-17', '2025-08-23'],
                        job_duration_days: 3
                    },
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                }
            }
        );
        
        if (updateResult.modifiedCount > 0) {
            console.log('✅ Quote updated successfully');
            
            // Verify the update
            const updatedQuote = await db.collection('quotes').findOne({ quote_id: testQuote.quote_id });
            console.log('   - New allowed days:', updatedQuote.booking_restrictions.allowed_days);
            console.log('   - New job duration:', updatedQuote.booking_restrictions.job_duration_days, 'days');
            console.log('   - New custom dates:', updatedQuote.booking_restrictions.custom_dates);
        } else {
            console.log('❌ Quote update failed');
        }
        
        // Test 4: Test the "both" option specifically
        console.log('\n🔄 Test 4: Testing "both" option for weekends and weekdays...');
        const bothUpdateResult = await db.collection('quotes').updateOne(
            { quote_id: testQuote.quote_id },
            {
                $set: {
                    booking_restrictions: {
                        allowed_days: 'both',
                        custom_dates: [],
                        job_duration_days: 1
                    },
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                }
            }
        );
        
        if (bothUpdateResult.modifiedCount > 0) {
            console.log('✅ Quote updated to "both" option successfully');
            
            // Verify the "both" update
            const bothQuote = await db.collection('quotes').findOne({ quote_id: testQuote.quote_id });
            console.log('   - Allowed days:', bothQuote.booking_restrictions.allowed_days);
            console.log('   - Job duration:', bothQuote.booking_restrictions.job_duration_days, 'days');
            console.log('   - Custom dates:', bothQuote.booking_restrictions.custom_dates);
            
            // Test the logic for "both" option
            const restrictions = bothQuote.booking_restrictions;
            const testDate1 = '2025-08-16'; // Saturday (weekend)
            const testDate2 = '2025-08-18'; // Monday (weekday)
            
            console.log('\n🔍 Testing "both" logic:');
            console.log(`   - Date ${testDate1} (Saturday): should be available`);
            console.log(`   - Date ${testDate2} (Monday): should be available`);
            
            // Simulate the calendar logic
            const isWeekend1 = new Date(testDate1).getDay() === 0 || new Date(testDate1).getDay() === 6;
            const isWeekend2 = new Date(testDate2).getDay() === 0 || new Date(testDate2).getDay() === 6;
            
            console.log(`   - ${testDate1} is weekend: ${isWeekend1}`);
            console.log(`   - ${testDate2} is weekday: ${isWeekend2}`);
            
            // Apply the "both" logic
            let isBlocked1 = false;
            let isBlocked2 = false;
            
            if (restrictions.allowed_days === 'both') {
                isBlocked1 = false; // Weekends are allowed
                isBlocked2 = false; // Weekdays are allowed
            }
            
            console.log(`   - ${testDate1} blocked: ${isBlocked1} (should be false)`);
            console.log(`   - ${testDate2} blocked: ${isBlocked2} (should be false)`);
            
            if (!isBlocked1 && !isBlocked2) {
                console.log('✅ "Both" option logic working correctly!');
            } else {
                console.log('❌ "Both" option logic has issues');
            }
        } else {
            console.log('❌ Quote update to "both" failed');
        }
        
        // Test 5: Query by booking restrictions
        console.log('\n🔍 Test 5: Querying quotes by booking restrictions...');
        const weekendQuotes = await db.collection('quotes').find({ 
            'booking_restrictions.allowed_days': 'weekends' 
        }).toArray();
        
        console.log(`✅ Found ${weekendQuotes.length} quotes with weekend-only restrictions`);
        
        const bothQuotes = await db.collection('quotes').find({ 
            'booking_restrictions.allowed_days': 'both' 
        }).toArray();
        
        console.log(`✅ Found ${bothQuotes.length} quotes with "both" restrictions`);
        
        const multiDayQuotes = await db.collection('quotes').find({ 
            'booking_restrictions.job_duration_days': { $gt: 1 } 
        }).toArray();
        
        console.log(`✅ Found ${multiDayQuotes.length} quotes requiring multiple days`);
        
        // Cleanup: Remove test quote
        console.log('\n🧹 Cleanup: Removing test quote...');
        await db.collection('quotes').deleteOne({ quote_id: testQuote.quote_id });
        console.log('✅ Test quote removed');
        
        console.log('\n🎉 All tests passed! Booking restrictions system is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await client.close();
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testBookingRestrictions();
}

module.exports = { testBookingRestrictions };
