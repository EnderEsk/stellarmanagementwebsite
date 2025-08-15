const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Simple test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running! MailerSend integration ready.' });
});

// Test MailerSend integration
app.get('/api/test-email', async (req, res) => {
    try {
        const EmailService = require('./email-service');
        const emailService = new EmailService();
        
        // Test email sending
        const result = await emailService.sendEmail(
            'stellartestmanagement@outlook.com', // Use your MailerSend account email
            'Test Email - Server Running',
            '<h1>🎉 Server is Running!</h1><p>Your Stellar Tree Management server is working correctly.</p>',
            'Server is Running!\n\nYour server is working correctly.'
        );
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Test email sent successfully!',
                messageId: result.messageId 
            });
        } else {
            res.json({ 
                success: false, 
                message: 'Email service error',
                error: result.error 
            });
        }
    } catch (error) {
        res.json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

// Serve the main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/booking', (req, res) => {
    res.sendFile(path.join(__dirname, 'booking/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Test Server Running!');
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`📧 Test Email: http://localhost:${PORT}/api/test-email`);
    console.log(`🏠 Home: http://localhost:${PORT}/`);
    console.log(`📅 Booking: http://localhost:${PORT}/booking`);
    console.log(`⚙️  Admin: http://localhost:${PORT}/admin`);
    console.log('');
    console.log('⚠️  This is a TEST server without database functionality');
    console.log('📋 To use full features, set up MongoDB in your .env file');
});

module.exports = app;
