const EmailService = require('./email-service');
const config = require('./config');

async function testMailerSend() {
    console.log('Testing MailerSend integration...');
    
    // Check if API key is configured
    if (!config.MAILERSEND_API_KEY || config.MAILERSEND_API_KEY === 'your_mailersend_api_key_here') {
        console.error('❌ MAILERSEND_API_KEY not configured in config.js file');
        console.log('Please add your MailerSend API key to your config.js file');
        return;
    }
    
    try {
        const emailService = new EmailService();
        
        // Test basic email sending
        console.log('\n📧 Testing basic email sending...');
        const testResult = await emailService.sendEmail(
            'endereeska@gmail.com', // Test email address - must be your admin email for trial account
            'Test Email from Stellar Tree Management',
            '<h1>Test Email</h1><p>This is a test email to verify MailerSend integration.</p>',
            'Test Email\n\nThis is a test email to verify MailerSend integration.'
        );
        
        if (testResult.success) {
            console.log('✅ Basic email test successful!');
            console.log('Message ID:', testResult.messageId);
        } else {
            console.log('❌ Basic email test failed:', testResult.error);
        }
        
        // Test quote email
        console.log('\n📋 Testing quote email...');
        const quoteResult = await emailService.sendQuoteEmail(
            'endereeska@gmail.com', // Test email address
            'QT-2024-001',
            'John Doe',
            '2024-12-20',
            450.00,
            [
                { description: 'Tree Removal', quantity: 1, price: 300.00, total: 300.00 },
                { description: 'Stump Grinding', quantity: 1, price: 150.00, total: 150.00 }
            ],
            'ST-ABC123' // Test booking ID
        );
        
        if (quoteResult.success) {
            console.log('✅ Quote email test successful!');
        } else {
            console.log('❌ Quote email test failed:', quoteResult.error);
        }
        
        // Test invoice email
        console.log('\n🧾 Testing invoice email...');
        const invoiceResult = await emailService.sendInvoiceEmailFromQuote(
            'endereeska@gmail.com', // Test email address
            'INV-2024-001',
            'John Doe',
            '2024-12-20',
            450.00,
            [
                { description: 'Tree Removal', quantity: 1, price: 300.00, total: 300.00 },
                { description: 'Stump Grinding', quantity: 1, price: 150.00, total: 150.00 }
            ]
        );
        
        if (invoiceResult.success) {
            console.log('✅ Invoice email test successful!');
        } else {
            console.log('❌ Invoice email test failed:', invoiceResult.error);
        }
        
        // Test booking confirmation email
        console.log('\n📅 Testing booking confirmation email...');
        const bookingResult = await emailService.sendBookingConfirmationEmail(
            'endereeska@gmail.com', // Test email address
            'ST-ABC123',
            'Tree Removal',
            '2024-12-25',
            '9:00 AM',
            'John Doe'
        );
        
        if (bookingResult.success) {
            console.log('✅ Booking confirmation email test successful!');
        } else {
            console.log('❌ Booking confirmation email test failed:', bookingResult.error);
        }
        
        console.log('\n🎉 MailerSend integration test completed!');
        
    } catch (error) {
        console.error('❌ Error during testing:', error);
    }
}

// Run the test
testMailerSend();
