const EmailService = require('./email-service');
const config = require('./config');

async function testMailerSendSimple() {
    console.log('🧪 Testing MailerSend Integration (Trial Account Compatible)');
    console.log('📧 Using API Key:', config.MAILERSEND_API_KEY.substring(0, 20) + '...');
    console.log('📧 From Email:', config.MAILERSEND_FROM_EMAIL);
    console.log('📧 From Name:', config.MAILERSEND_FROM_NAME);
    console.log('');
    
    try {
        const emailService = new EmailService();
        
        // Test 1: Simple email to your verified email
        console.log('📧 Test 1: Simple Email');
        console.log('Sending to: endereeska@gmail.com (your personal email for trial account)');
        
        const testResult = await emailService.sendEmail(
            'endereeska@gmail.com', // Send to your personal email (trial restriction)
            'Test Email - Stellar Tree Management',
            `
                <h1>🎉 MailerSend Integration Test</h1>
                <p>This is a test email to verify your MailerSend integration is working!</p>
                <h2>What this means:</h2>
                <ul>
                    <li>✅ Your API key is valid</li>
                    <li>✅ Email service is connected</li>
                    <li>✅ Templates are working</li>
                    <li>✅ Ready to send to customers!</li>
                </ul>
                <p><strong>Next steps:</strong></p>
                <ol>
                    <li>Verify your domain in MailerSend dashboard</li>
                    <li>Update config.js to use your domain email</li>
                    <li>Start sending emails to customers</li>
                </ol>
                <p>Best regards,<br>Your Development Team</p>
            `,
            `
                🎉 MailerSend Integration Test
                
                This is a test email to verify your MailerSend integration is working!
                
                What this means:
                ✅ Your API key is valid
                ✅ Email service is connected
                ✅ Templates are working
                ✅ Ready to send to customers!
                
                Next steps:
                1. Verify your domain in MailerSend dashboard
                2. Update config.js to use your domain email
                3. Start sending emails to customers
                
                Best regards,
                Your Development Team
            `
        );
        
        if (testResult.success) {
            console.log('✅ SUCCESS! Email sent successfully');
            console.log('📧 Message ID:', testResult.messageId);
            console.log('');
            console.log('🎯 Your MailerSend integration is working!');
            console.log('📋 You can now:');
            console.log('   • Send quote emails to customers');
            console.log('   • Send invoice emails to customers');
            console.log('   • Send booking confirmations');
            console.log('');
            console.log('🚀 To send to customers (not just your email):');
            console.log('   1. Go to MailerSend dashboard');
            console.log('   2. Verify your domain: stellartreemanagement.ca');
            console.log('   3. Update config.js to use your domain email');
            console.log('   4. Or upgrade to a paid plan');
        } else {
            console.log('❌ FAILED to send email');
            console.log('📧 Error:', testResult.error);
            console.log('');
            console.log('🔧 Troubleshooting:');
            console.log('   1. Check your API key is correct');
            console.log('   2. Verify your email in MailerSend dashboard');
            console.log('   3. Check the MAILERSEND_SETUP_GUIDE.md');
        }
        
    } catch (error) {
        console.error('❌ Error during testing:', error);
        console.log('');
        console.log('🔧 Check the MAILERSEND_SETUP_GUIDE.md for solutions');
    }
}

// Run the test
testMailerSendSimple();
