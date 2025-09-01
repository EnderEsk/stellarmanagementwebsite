const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testQuoteSending() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db(process.env.MONGODB_DB_NAME || 'stellartmanagement');
        
        // Find a booking to test with
        const booking = await db.collection('bookings').findOne({});
        if (!booking) {
            console.log('❌ No bookings found in database');
            return;
        }
        
        console.log('📋 Found booking:', {
            booking_id: booking.booking_id,
            name: booking.name,
            email: booking.email,
            service: booking.service,
            status: booking.status
        });
        
        // Check if there are any quotes for this booking
        const quotes = await db.collection('quotes').find({ booking_id: booking.booking_id }).toArray();
        console.log(`📊 Found ${quotes.length} quotes for this booking`);
        
        if (quotes.length > 0) {
            const latestQuote = quotes[quotes.length - 1];
            console.log('📋 Latest quote:', {
                quote_id: latestQuote.quote_id,
                service_items: latestQuote.service_items,
                total_amount: latestQuote.total_amount
            });
            
            // Try to parse service items
            try {
                const serviceItems = JSON.parse(latestQuote.service_items);
                console.log('✅ Parsed service items:', serviceItems);
                
                // Validate structure
                serviceItems.forEach((item, index) => {
                    console.log(`📦 Item ${index}:`, {
                        description: item.description,
                        quantity: item.quantity,
                        price: item.price,
                        total: item.total,
                        hasDescription: !!item.description,
                        hasQuantity: typeof item.quantity !== 'undefined',
                        hasPrice: typeof item.price !== 'undefined',
                        hasTotal: typeof item.total !== 'undefined'
                    });
                });
            } catch (parseError) {
                console.error('❌ Error parsing service items:', parseError);
            }
        }
        
        // Test the email service directly
        console.log('\n🧪 Testing EmailService...');
        const EmailService = require('./email-service');
        const emailService = new EmailService();
        
        // Create test service items
        const testServiceItems = [{
            description: 'Test Tree Service',
            quantity: 1,
            price: 150.00,
            total: 150.00
        }];
        
        console.log('📧 Sending test quote email...');
        const result = await emailService.sendQuoteEmail(
            'test@example.com',
            'TEST-QT-001',
            'Test Customer',
            '2024-01-15',
            150.00,
            testServiceItems,
            booking.booking_id
        );
        
        console.log('📧 Email result:', result);
        
    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        await client.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the test
testQuoteSending().catch(console.error);





