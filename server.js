require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { connectToDatabase, getDatabase, closeConnection } = require('./database');
const { Binary, ObjectId } = require('mongodb');



const app = express();
// Respect X-Forwarded-* headers when behind reverse proxies / CDNs
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10 // Maximum 10 files per booking
    },
    fileFilter: function (req, file, cb) {
        // Allow only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Add JSON parsing for specific routes that need it
app.use('/api/bookings/:bookingId/status', express.json());
app.use('/api/blocked-dates', express.json());
app.use('/api/bookings/:bookingId/move', express.json());
app.use('/api/bookings/:bookingId/notes', express.json());
app.use('/api/quotes', express.json());
app.use('/api/quotes/:quoteId', express.json());
app.use('/api/invoices', express.json());
app.use('/api/invoices/:invoiceId/payment', express.json());
app.use('/api/customers', express.json());
app.use('/api/customers/:customerId', express.json());
app.use('/api/customers/search/:query', express.json());
app.use('/api/customers/migrate', express.json());
app.use('/api/bookings/stats/overview', express.json());
app.use('/api/customers/recalculate-totals', express.json());
app.use('/api/customers/:customerId/recalculate-total', express.json());

// OAuth Configuration
const ALLOWED_ADMIN_EMAILS = [
    'aiplanet100@gmail.com',
    'stellartreemanagement@outlook.com',
    'stellartestmanagement@outlook.com',
    'stephanetmichaud@gmail.com',
    'aiplanet1000@gmail.com',
    'endereeska@gmail.com'
];

const GOOGLE_CLIENT_ID = '1081522229555-uj7744efea2p487bj7oa5p1janijfepl.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

// Add CORS headers for OAuth (dynamic origin)
app.use('/api/auth/*', (req, res, next) => {
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
});

// Helper to compute the correct public redirect URI
function getEffectiveRedirectUri(req, providedRedirectUri) {
    if (providedRedirectUri) return providedRedirectUri;
    if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
    
    // Get the origin from the request headers
    const origin = req.headers.origin;
    if (origin) {
        return `${origin}/admin.html`;
    }
    
    // Fallback to host-based calculation
    const host = req.get('host');
    const isLocal = host.includes('localhost') || host.startsWith('127.0.0.1');
    const proto = req.protocol; // honors X-Forwarded-Proto due to trust proxy
    const scheme = isLocal ? proto : 'https';
    return `${scheme}://${host}/admin.html`;
}

// Test endpoint to check if server is running
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// Debug endpoint for OAuth configuration
app.get('/api/auth/google/debug-config', (req, res) => {
    const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
    const effectiveRedirectUri = getEffectiveRedirectUri(req);
    
    res.json({
        clientId: process.env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? '***SET***' : '***NOT SET***',
        origin: origin,
        effectiveRedirectUri: effectiveRedirectUri,
        allowedEmails: ALLOWED_ADMIN_EMAILS,
        timestamp: new Date().toISOString()
    });
});

// OAuth Authentication Endpoints
app.post('/api/auth/google/verify', async (req, res) => {
    try {
        console.log('🔐 Google OAuth verification request received');
        console.log('Request body:', req.body);
        
        const { idToken, email, name, picture } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }
        
        console.log('📧 Verifying email:', email);
        console.log('📋 Allowed emails:', ALLOWED_ADMIN_EMAILS);
        
        // Verify the email is in the allowed list
        if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
            console.log('❌ Access denied for email:', email);
            return res.status(403).json({
                success: false,
                error: 'Access denied. This email is not authorized to access the admin panel.'
            });
        }
        
        console.log('✅ Email verified successfully');
        
        // In a production environment, you would verify the ID token with Google
        // For now, we'll trust the client-side verification for development
        // In production, you should use Google's token verification API
        
        const userProfile = {
            email: email,
            name: name || 'Admin User',
            picture: picture || '',
            provider: 'google'
        };
        
        console.log('✅ User profile created:', userProfile);
        
        res.json({
            success: true,
            userProfile: userProfile
        });
        
    } catch (error) {
        console.error('❌ Google OAuth verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed: ' + error.message
        });
    }
});

app.post('/api/auth/microsoft/verify', async (req, res) => {
    try {
        const { email, name, picture } = req.body;
        
        // Verify the email is in the allowed list
        if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. This email is not authorized to access the admin panel.'
            });
        }
        
        const userProfile = {
            email: email,
            name: name,
            picture: picture,
            provider: 'microsoft'
        };
        
        res.json({
            success: true,
            userProfile: userProfile
        });
        
    } catch (error) {
        console.error('Microsoft OAuth verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
});

// Google OAuth callback endpoint
app.post('/api/auth/google/callback', async (req, res) => {
    console.log('🔄 Google OAuth callback received');
    console.log('Request body received fields:', Object.keys(req.body || {}));
    
    const { code, redirectUri } = req.body;
    
    if (!code) {
        console.log('❌ No authorization code provided');
        return res.status(400).json({
            success: false,
            error: 'No authorization code provided'
        });
    }
    
    try {
        const effectiveRedirectUri = getEffectiveRedirectUri(req, redirectUri);
        console.log('🔗 Using redirect_uri for token exchange:', effectiveRedirectUri);
        console.log('🔗 Using client_id:', (process.env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID));
        console.log('🔗 Request origin:', req.headers.origin);
        console.log('🔗 Request host:', req.get('host'));
        
        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code: code,
                client_id: process.env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET || GOOGLE_CLIENT_SECRET,
                redirect_uri: effectiveRedirectUri,
                grant_type: 'authorization_code'
            })
        });
        
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || tokenData.error) {
            console.log('❌ Token exchange failed:', tokenData);
            return res.status(400).json({
                success: false,
                error: 'Token exchange failed',
                details: tokenData.error_description || tokenData.error || 'Unknown error from Google',
                googleResponse: tokenData
            });
        }
        
        // Get user info with access token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });
        
        const userInfo = await userInfoResponse.json();
        
        console.log('📧 User info received:', userInfo.email);
        console.log('📋 Allowed emails:', ALLOWED_ADMIN_EMAILS);
        
        // Check if email is in allowed list
        if (ALLOWED_ADMIN_EMAILS.includes(userInfo.email)) {
            console.log('✅ Email verified successfully');
            
            const userProfile = {
                email: userInfo.email,
                name: userInfo.name || userInfo.email,
                picture: userInfo.picture || '',
                provider: 'google'
            };
            
            console.log('✅ User profile created:', userProfile);
            
            res.json({
                success: true,
                userProfile: userProfile
            });
        } else {
            console.log('❌ Email not authorized:', userInfo.email);
            res.status(401).json({
                success: false,
                error: 'Email not authorized'
            });
        }
        
    } catch (error) {
        console.error('❌ OAuth callback error:', error);
        res.status(500).json({
            success: false,
            error: 'OAuth callback failed'
        });
    }
});

// File upload configuration removed - using the one at the top

// Serve images from MongoDB or filesystem (for backward compatibility)
app.get('/uploads/:imageId', async (req, res) => {
    try {
        const imageId = req.params.imageId;
        
        // First, try to serve from MongoDB (new format)
        try {
            const objectId = new ObjectId(imageId);
            const image = await db.collection('images').findOne({ _id: objectId });
            
            if (image) {
                // Set content type and cache headers
                res.set('Content-Type', image.contentType);
                res.set('Cache-Control', 'public, max-age=86400'); // 1 day cache
                
                // Send the image data
                res.send(image.data.buffer);
                return;
            }
        } catch (error) {
            // Not a valid ObjectId, continue to filesystem check
        }
        
        // If not found in MongoDB, try filesystem (old format)
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, 'uploads');
        
        // Check if this looks like an old filesystem path
        if (imageId.includes('booking-') && (imageId.includes('.jpg') || imageId.includes('.jpeg') || imageId.includes('.png') || imageId.includes('.gif') || imageId.includes('.webp'))) {
            const filePath = path.join(uploadsDir, imageId);
            
            if (fs.existsSync(filePath)) {
                const ext = path.extname(imageId).toLowerCase();
                const contentType = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.webp': 'image/webp'
                }[ext] || 'application/octet-stream';
                
                res.set('Content-Type', contentType);
                res.set('Cache-Control', 'public, max-age=86400');
                res.sendFile(filePath);
                console.log(`✅ Served old filesystem image: ${imageId}`);
                return;
            } else {
                console.log(`❌ Old filesystem image not found: ${imageId}`);
            }
        }
        
        console.log(`❌ Image not found: ${imageId}`);
        res.status(404).json({ error: 'Image not found' });
        
    } catch (error) {
        console.error('Error serving image:', error);
        res.status(500).json({ error: 'Failed to serve image' });
    }
});

// Serve admin configuration
app.get('/api/admin-config', (req, res) => {
    const dynamicRedirectUri = getEffectiveRedirectUri(req);
    const adminConfig = {
        PASSWORD: process.env.ADMIN_PASSWORD || 'stellar2024',
        SESSION_TIMEOUT: process.env.NODE_ENV === 'production' 
            ? (parseInt(process.env.SESSION_TIMEOUT) || 120)
            : (parseInt(process.env.SESSION_TIMEOUT) || 60),
        MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        LOCKOUT_DURATION: parseInt(process.env.LOCKOUT_DURATION) || 15,
        ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@stellartreemanagement.com',
        COMPANY_NAME: process.env.COMPANY_NAME || 'Stellar Tree Management',
        // Expose OAuth client config to the browser (no secrets)
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID,
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || dynamicRedirectUri,
        ALLOWED_ADMIN_EMAILS: ALLOWED_ADMIN_EMAILS
    };
    
    res.json(adminConfig);
});

// OAuth debug config endpoint for diagnostics
app.get('/api/auth/google/debug-config', (req, res) => {
    const dynamicRedirectUri = getEffectiveRedirectUri(req);
    res.json({
        clientId: process.env.GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID || null,
        redirectFromEnv: process.env.GOOGLE_REDIRECT_URI || null,
        dynamicRedirectUri,
        nodeEnv: process.env.NODE_ENV || 'development',
        hostHeader: req.get('host'),
        protocol: req.protocol
    });
});

// Initialize MongoDB connection and start server
async function startServer() {
    try {
        const database = await connectToDatabase();
        db = database;
        console.log('🚀 Server ready with MongoDB');
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`🌐 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Admin authentication middleware
function requireAdminAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Admin authentication required' });
    }
    
    // Extract email from Bearer token
    const token = authHeader.replace('Bearer ', '');
    const email = token; // For now, the token is the email
    
    // Check if email is in allowed list
    if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
        return res.status(403).json({ error: 'Access denied. This email is not authorized to access the admin panel.' });
    }
    
    // Add user info to request for use in routes
    req.user = { email: email };
    
    next();
}

// API Routes

// Get all bookings (admin only for full list)
app.get('/api/bookings', requireAdminAuth, async (req, res) => {
    try {
        const bookings = await db.collection('bookings')
            .find({})
            .sort({ date: 1, time: 1 })
            .toArray();
        res.json(bookings);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get bookings for a specific date
app.get('/api/bookings/date/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const bookings = await db.collection('bookings')
            .find({ date: date })
            .sort({ time: 1 })
            .toArray();
        res.json(bookings);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Helper function to normalize time formats
function normalizeTimeFormat(time) {
    // Handle "Full Day" format (old format)
    if (time === 'Full Day') {
        return '8:00 AM'; // Default to morning slot
    }
    
    // Handle 24-hour format (e.g., "14:00", "15:00", "16:00")
    if (time.includes(':')) {
        const [hours, minutes] = time.split(':').map(Number);
        if (hours === 8) return '8:00 AM';
        if (hours === 13) return '1:00 PM';
        if (hours === 16) return '4:00 PM';
        if (hours === 14) return '1:00 PM'; // 14:00 = 2 PM, but we'll map to 1 PM
        if (hours === 15) return '4:00 PM'; // 15:00 = 3 PM, but we'll map to 4 PM
    }
    
    // Return as-is if it's already in 12-hour format
    return time;
}

// Helper function to format date consistently
function formatDateInCalgary(date) {
    // Format date as YYYY-MM-DD using the date as provided
    // No timezone conversion needed since dates are already in the correct timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get availability data for a date range
app.get('/api/availability', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        
        // Get bookings for the date range
        const bookings = await db.collection('bookings')
            .find({
                date: { $gte: start_date, $lte: end_date },
                status: { $in: ['pending', 'confirmed'] }
            })
            .sort({ date: 1, time: 1 })
            .toArray();
        
        // Group by date and time slot with normalized times
        const availability = {};
        bookings.forEach(booking => {
            const normalizedTime = normalizeTimeFormat(booking.time);
            
            if (!availability[booking.date]) {
                availability[booking.date] = {};
            }
            if (!availability[booking.date][normalizedTime]) {
                availability[booking.date][normalizedTime] = 0;
            }
            availability[booking.date][normalizedTime]++;
        });
        
        // Also include blocked dates in the response (excluding unblocked weekends)
        const blockedDates = await db.collection('blocked_dates')
            .find({
                date: { $gte: start_date, $lte: end_date }
            })
            .toArray();
        
        // Add blocked dates to availability data (excluding unblocked weekends)
        blockedDates.forEach(blocked => {
            if (blocked.reason !== 'unblocked_weekend') {
                if (!availability[blocked.date]) {
                    availability[blocked.date] = {};
                }
                availability[blocked.date]['blocked'] = true;
            }
        });
        
        res.json(availability);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Create new booking with image uploads
app.post('/api/bookings', upload.array('images', 5), async (req, res) => {
    try {
        const {
            booking_id,
            service,
            date,
            time,
            name,
            email,
            phone,
            address,
            notes
        } = req.body;

        // Input validation and sanitization
        if (!booking_id || !service || !date || !time || !name || !email || !phone || !address) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate service type
        const validServices = ['Tree Removal', 'Trimming & Pruning', 'Stump Grinding', 'Emergency Service'];
        if (!validServices.includes(service)) {
            return res.status(400).json({ error: 'Invalid service type' });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        // Validate time format
        const validTimes = ['8:00 AM', '1:00 PM', '4:00 PM'];
        if (!validTimes.includes(time)) {
            return res.status(400).json({ error: 'Invalid time slot' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate phone format (basic validation)
        const phoneRegex = /^[\d\s\(\)\+\-\.]{10,}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Sanitize text inputs (remove potential script tags and excessive whitespace)
        const sanitize = (str) => str.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        const sanitizedData = {
            booking_id: booking_id.trim(),
            service: service.trim(),
            date: date.trim(),
            time: time.trim(),
            name: sanitize(name),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            address: sanitize(address),
            notes: notes ? sanitize(notes) : ''
        };

        // Use sanitized data directly instead of reassigning constants
        const cleanedData = {
            booking_id: sanitizedData.booking_id,
            service: sanitizedData.service,
            date: sanitizedData.date,
            time: sanitizedData.time,
            name: sanitizedData.name,
            email: sanitizedData.email,
            phone: sanitizedData.phone,
            address: sanitizedData.address,
            notes: sanitizedData.notes
        };

        // Check for double booking (same time slot) - only check active bookings
        const existingTimeSlotBooking = await db.collection('bookings').findOne({
            date: cleanedData.date,
            time: cleanedData.time,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingTimeSlotBooking) {
            return res.status(409).json({ 
                error: 'This time slot is already booked by another customer',
                type: 'time_slot_conflict',
                existingBooking: {
                    date: existingTimeSlotBooking.date,
                    time: existingTimeSlotBooking.time,
                    status: existingTimeSlotBooking.status
                }
            });
        }

        // Additional validation: Check if this is a weekend and weekends are blocked
        const bookingDate = new Date(cleanedData.date);
        const dayOfWeek = bookingDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
        
        if (isWeekend) {
            // Check if this weekend date has been explicitly unblocked
            const unblocked = await db.collection('blocked_dates').findOne({ 
                date: cleanedData.date, 
                reason: 'unblocked_weekend' 
            });
            
            if (!unblocked) {
                return res.status(409).json({ 
                    error: 'Weekend dates are not available for booking. Please select a weekday.',
                    type: 'weekend_blocked'
                });
            }
        }

        // Validate booking date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const bookingDateOnly = new Date(cleanedData.date);
        bookingDateOnly.setHours(0, 0, 0, 0);
        
        if (bookingDateOnly < today) {
            return res.status(400).json({ 
                error: 'Cannot book appointments for past dates',
                type: 'past_date'
            });
        }

        // Check if the date is blocked
        const blockedDate = await db.collection('blocked_dates').findOne({ date: cleanedData.date });
        if (blockedDate) {
            return res.status(409).json({ 
                error: `This date (${cleanedData.date}) is not available for booking. Please select a different date.`,
                type: 'date_blocked',
                reason: blockedDate.reason
            });
        }

        // Check for duplicate booking by same customer on same date
        const sameDateBooking = await db.collection('bookings').findOne({
            $or: [
                { phone: cleanedData.phone },
                { email: cleanedData.email }
            ],
            date: cleanedData.date,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (sameDateBooking) {
            return res.status(409).json({ 
                error: `You already have a booking on ${cleanedData.date}. Only one booking per customer per day is allowed.`,
                type: 'same_date_booking_exists',
                existingBooking: {
                    date: sameDateBooking.date,
                    time: sameDateBooking.time,
                    status: sameDateBooking.status,
                    bookingId: sameDateBooking.booking_id
                }
            });
        }

        // Check if customer has too many active bookings (limit to 3 active bookings)
        const activeBookings = await db.collection('bookings').find({
            $or: [
                { phone: cleanedData.phone },
                { email: cleanedData.email }
            ],
            status: { $in: ['pending', 'confirmed'] }
        }).toArray();

        if (activeBookings.length >= 3) {
            return res.status(409).json({ 
                error: `You have reached the maximum number of active bookings (3). Please complete or cancel an existing booking before making a new one.`,
                type: 'max_active_bookings',
                activeBookings: activeBookings.map(b => ({
                    date: b.date,
                    time: b.time,
                    status: b.status,
                    bookingId: b.booking_id,
                    service: b.service
                }))
            });
        }

        // Check if customer already exists with this phone number
        let existingCustomer = await db.collection('customers').findOne({ phone: cleanedData.phone });
        let customerId;
        
        if (existingCustomer) {
            // Use existing customer
            customerId = existingCustomer.customer_id;
            console.log(`Using existing customer ${customerId} for phone ${cleanedData.phone}`);
        } else {
            // Create a new customer
            customerId = generateUniqueId('CUST');
            const newCustomer = {
                customer_id: customerId,
                name: cleanedData.name,
                email: cleanedData.email,
                phone: cleanedData.phone,
                address: cleanedData.address,
                total_bookings: 0,
                total_spent: 0,
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
                updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };
            
            await db.collection('customers').insertOne(newCustomer);
            console.log(`Created new customer ${customerId} for phone ${cleanedData.phone}`);
        }

        // Process uploaded images with improved error handling
        const imagePaths = [];
        if (req.files && req.files.length > 0) {
            console.log(`Processing ${req.files.length} uploaded files for booking ${cleanedData.booking_id}`);
            
            for (const file of req.files) {
                try {
                    // Create a unique ID for the image
                    const imageId = new ObjectId();
                    
                    // Store the image in MongoDB
                    await db.collection('images').insertOne({
                        _id: imageId,
                        bookingId: cleanedData.booking_id,
                        filename: file.originalname,
                        contentType: file.mimetype,
                        size: file.size,
                        data: new Binary(file.buffer),
                        uploadedAt: new Date()
                    });

                    // Store the URL path for serving
                    const urlPath = `/uploads/${imageId}`;
                    imagePaths.push(urlPath);
                    
                    console.log(`✅ Image saved to MongoDB: ${urlPath} (${(file.size / 1024).toFixed(2)}KB)`);
                } catch (error) {
                    console.error(`❌ Error storing image ${file.originalname}:`, error);
                }
            }
        }
        
        const imagesJson = JSON.stringify(imagePaths);
        if (imagePaths.length > 0) {
            console.log(`📸 Stored ${imagePaths.length} images for booking ${cleanedData.booking_id}`);
        }

        // Insert new booking with customer_id and images
        const newBooking = {
            booking_id: cleanedData.booking_id,
            customer_id: customerId,
            service: cleanedData.service,
            date: cleanedData.date,
            time: cleanedData.time,
            name: cleanedData.name,
            email: cleanedData.email,
            phone: cleanedData.phone,
            address: cleanedData.address,
            notes: cleanedData.notes || '',
            images: imagesJson,
            status: 'pending',
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        const result = await db.collection('bookings').insertOne(newBooking);

        // Send confirmation email (placeholder for now)
        sendConfirmationEmail(cleanedData.email, cleanedData.booking_id, cleanedData.service, cleanedData.date, cleanedData.time, cleanedData.name);

        res.status(201).json({
            message: 'Booking created successfully',
            bookingId: cleanedData.booking_id,
            customerId: customerId,
            id: result.insertedId
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Update booking status (admin only)
app.patch('/api/bookings/:bookingId/status', requireAdminAuth, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        if (!status || !['pending', 'confirmed', 'pending-booking', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // First, get the customer_id for this booking
        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Update the booking status
        const result = await db.collection('bookings').updateOne(
            { booking_id: bookingId },
            { 
                $set: { 
                    status: status, 
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                } 
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // If booking is completed, update customer total spent
        if (status === 'completed' && booking.customer_id) {
            try {
                await updateCustomerTotalSpent(booking.customer_id);
            } catch (error) {
                console.error('Error updating customer total spent:', error);
                // Don't fail the request, just log the error
            }
        }

        res.json({ message: 'Booking status updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get booking by ID
app.get('/api/bookings/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json(booking);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete booking and associated images (admin only)
app.delete('/api/bookings/:bookingId', requireAdminAuth, async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Get the booking first to check for images
        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Delete associated images from MongoDB
        try {
            if (booking.images) {
                const imagePaths = JSON.parse(booking.images);
                for (const imagePath of imagePaths) {
                    const imageId = imagePath.split('/').pop(); // Extract ID from path
                    await db.collection('images').deleteOne({ _id: new ObjectId(imageId) });
                    console.log(`🗑️ Deleted image: ${imageId}`);
                }
            }
        } catch (error) {
            console.error('Error deleting images:', error);
        }

        // Delete the booking
        const result = await db.collection('bookings').deleteOne({ booking_id: bookingId });
        
        res.json({ message: 'Booking and associated images deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Send booking confirmation email to customer (admin only)
app.post('/api/bookings/:bookingId/send-booking-email', requireAdminAuth, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { customerEmail, customerName } = req.body;

        // Get booking details
        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Send booking confirmation email with unique link
        const emailContent = sendBookingConfirmationEmail(
            customerEmail, 
            bookingId, 
            booking.service, 
            booking.date, 
            booking.time, 
            customerName
        );

        console.log('📧 Quote confirmation email endpoint called successfully');
        console.log('📧 Email content:', emailContent);
        res.json({
            message: 'Booking confirmation email content generated successfully',
            emailContent: emailContent
        });
    } catch (error) {
        console.error('Error sending booking email:', error);
        res.status(500).json({ error: 'Failed to send booking email' });
    }
});

// Send booking confirmation email after admin confirms booking
app.post('/api/bookings/:bookingId/send-confirmation-email', requireAdminAuth, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { customerEmail, customerName } = req.body;

        // Get booking details
        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Send booking confirmation email
        const emailContent = sendBookingFinalConfirmationEmail(
            customerEmail, 
            bookingId, 
            booking.service, 
            booking.date, 
            booking.time, 
            customerName
        );

        console.log('📧 Final confirmation email endpoint called successfully');
        console.log('📧 Email content:', emailContent);
        res.json({
            message: 'Final booking confirmation email content generated successfully',
            emailContent: emailContent
        });
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        res.status(500).json({ error: 'Failed to send confirmation email' });
    }
});

// Customer confirms booking (public endpoint)
app.post('/api/bookings/:bookingId/confirm', async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Get booking details
        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Check if booking is in confirmed status (Request Booking)
        if (booking.status !== 'confirmed') {
            return res.status(400).json({ error: 'Booking is not in confirmed status' });
        }

        // Update booking status to pending-booking (Booking Pending)
        const result = await db.collection('bookings').updateOne(
            { booking_id: bookingId },
            { 
                $set: { 
                    status: 'pending-booking', 
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                } 
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Update customer total spent if customer_id exists
        if (booking.customer_id) {
            try {
                await updateCustomerTotalSpent(booking.customer_id);
            } catch (error) {
                console.error('Error updating customer total spent:', error);
                // Don't fail the request, just log the error
            }
        }

        res.json({ message: 'Booking confirmed successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get comprehensive booking statistics
app.get('/api/bookings/stats/overview', async (req, res) => {
    try {
        const today = formatDateInCalgary(new Date());
        const thirtyDaysAgo = formatDateInCalgary(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        const sevenDaysAgo = formatDateInCalgary(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        
        // Basic booking stats
        const bookingStats = await db.collection('bookings').aggregate([
            {
                $group: {
                    _id: null,
                    total_bookings: { $sum: 1 },
                    pending_bookings: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    confirmed_bookings: {
                        $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
                    },
                    pending_booking_bookings: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending-booking'] }, 1, 0] }
                    },
                    completed_bookings: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    cancelled_bookings: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                    },
                    upcoming_bookings: {
                        $sum: { $cond: [{ $gte: ['$date', today] }, 1, 0] }
                    },
                    bookings_last_30_days: {
                        $sum: { $cond: [{ $gte: ['$created_at', thirtyDaysAgo] }, 1, 0] }
                    },
                    bookings_last_7_days: {
                        $sum: { $cond: [{ $gte: ['$created_at', sevenDaysAgo] }, 1, 0] }
                    }
                }
            }
        ]).toArray();

        // Service popularity stats
        const serviceStats = await db.collection('bookings').aggregate([
            {
                $group: {
                    _id: '$service',
                    count: { $sum: 1 },
                    completed_count: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]).toArray();

        // Customer stats
        const customerStats = await db.collection('customers').aggregate([
            {
                $group: {
                    _id: null,
                    total_customers: { $sum: 1 },
                    customers_with_bookings: {
                        $sum: { $cond: [{ $gt: ['$total_bookings', 0] }, 1, 0] }
                    }
                }
            }
        ]).toArray();

        // Revenue stats (from invoices)
        const revenueStats = await db.collection('invoices').aggregate([
            {
                $group: {
                    _id: null,
                    total_invoices: { $sum: 1 },
                    total_revenue: { $sum: '$total_amount' },
                    paid_invoices: {
                        $sum: { $cond: [{ $eq: ['$payment_status', 'paid'] }, 1, 0] }
                    },
                    paid_revenue: {
                        $sum: { $cond: [{ $eq: ['$payment_status', 'paid'] }, '$total_amount', 0] }
                    },
                    pending_revenue: {
                        $sum: { $cond: [{ $ne: ['$payment_status', 'paid'] }, '$total_amount', 0] }
                    }
                }
            }
        ]).toArray();

        // Recent activity (last 10 bookings)
        const recentBookings = await db.collection('bookings')
            .find({})
            .sort({ created_at: -1 })
            .limit(10)
            .toArray();

        // Compile comprehensive stats
        const stats = {
            ...(bookingStats[0] || {
                total_bookings: 0,
                pending_bookings: 0,
                confirmed_bookings: 0,
                completed_bookings: 0,
                cancelled_bookings: 0,
                upcoming_bookings: 0,
                bookings_last_30_days: 0,
                bookings_last_7_days: 0
            }),
            service_stats: serviceStats,
            customer_stats: customerStats[0] || { total_customers: 0, customers_with_bookings: 0 },
            revenue_stats: revenueStats[0] || {
                total_invoices: 0,
                total_revenue: 0,
                paid_invoices: 0,
                paid_revenue: 0,
                pending_revenue: 0
            },
            recent_bookings: recentBookings.map(booking => ({
                booking_id: booking.booking_id,
                name: booking.name,
                service: booking.service,
                date: booking.date,
                status: booking.status,
                created_at: booking.created_at
            })),
            system_health: {
                database_connected: true,
                last_updated: new Date().toISOString()
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            error: 'Database error',
            system_health: {
                database_connected: false,
                last_updated: new Date().toISOString()
            }
        });
    }
});

// Get all blocked dates
app.get('/api/blocked-dates', async (req, res) => {
    try {
        const blockedDates = await db.collection('blocked_dates')
            .find({})
            .sort({ date: 1 })
            .toArray();
        
        const formattedDates = blockedDates.map(row => ({
            date: row.date,
            reason: row.reason
        }));
        res.json(formattedDates);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Block a date
app.post('/api/blocked-dates', async (req, res) => {
    try {
        const { date, reason, unblockWeekend } = req.body;
        
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }
        
        if (unblockWeekend) {
            // For weekend unblocking, we add a special reason to indicate it's unblocked
            const unblockReason = 'unblocked_weekend';
            
            const result = await db.collection('blocked_dates').updateOne(
                { date: date },
                { $set: { date: date, reason: unblockReason } },
                { upsert: true }
            );
            
            res.json({ message: 'Weekend made available for booking', id: result.upsertedId });
        } else {
            // Regular date blocking
            try {
                const result = await db.collection('blocked_dates').insertOne({
                    date: date,
                    reason: reason || null,
                    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                });
                
                res.json({ message: 'Date blocked successfully', id: result.insertedId });
            } catch (error) {
                if (error.code === 11000) { // MongoDB duplicate key error
                    return res.status(409).json({ error: 'Date is already blocked' });
                }
                throw error;
            }
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Unblock a date
app.delete('/api/blocked-dates/:date', async (req, res) => {
    try {
        const { date } = req.params;
        
        const result = await db.collection('blocked_dates').deleteOne({ date: date });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Blocked date not found' });
        }
        
        res.json({ message: 'Date unblocked successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Move booking to a new date
app.patch('/api/bookings/:bookingId/move', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { newDate } = req.body;
        
        if (!newDate) {
            return res.status(400).json({ error: 'New date is required' });
        }
        
        // Check if the new date is available (any time slot)
        const existingBookings = await db.collection('bookings').countDocuments({
            date: newDate,
            status: { $in: ['pending', 'confirmed'] }
        });
        
        // Check if all time slots are taken (3 slots per day)
        if (existingBookings >= 3) {
            return res.status(409).json({ error: `All time slots are already booked on ${newDate}` });
        }
        
        // Check if the new date is blocked
        const blockedDate = await db.collection('blocked_dates').findOne({ date: newDate });
        
        if (blockedDate) {
            return res.status(409).json({ error: 'Target date is blocked' });
        }
        
        // Update the booking date
        const result = await db.collection('bookings').updateOne(
            { booking_id: bookingId },
            { 
                $set: { 
                    date: newDate, 
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                } 
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        res.json({ message: 'Booking moved successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get bookings by date range
app.get('/api/bookings/range', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const bookings = await db.collection('bookings')
            .find({
                date: { $gte: start_date, $lte: end_date }
            })
            .sort({ date: 1, time: 1 })
            .toArray();

        res.json(bookings);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update booking notes
app.patch('/api/bookings/:bookingId/notes', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { notes } = req.body;

        if (notes === undefined) {
            return res.status(400).json({ error: 'Notes field is required' });
        }

        const result = await db.collection('bookings').updateOne(
            { booking_id: bookingId },
            { 
                $set: { 
                    notes: notes, 
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                } 
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({ message: 'Notes updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Generate unique ID
function generateUniqueId(prefix) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
}

// Quotes API endpoints

// Create a new quote
app.post('/api/quotes', async (req, res) => {
    try {
        const {
            booking_id,
            client_name,
            client_phone,
            client_address,
            client_email,
            quote_date,
            service_items,
            subtotal,
            tax_amount,
            total_amount,
            tax_enabled
        } = req.body;

        if (!booking_id || !client_name || !client_phone || !client_address || !client_email || !quote_date || !service_items) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const quote_id = generateUniqueId('QT');
        const serviceItemsJson = JSON.stringify(service_items);

        // Get the customer_id from the original booking
        const booking = await db.collection('bookings').findOne({ booking_id: booking_id });
        let customerId = null;
        
        if (booking && booking.customer_id) {
            customerId = booking.customer_id;
        } else {
            // Create a new customer if booking doesn't exist or has no customer_id
            customerId = generateUniqueId('CUST');
            const newCustomer = {
                customer_id: customerId,
                name: client_name,
                email: client_email,
                phone: client_phone,
                address: client_address,
                total_bookings: 0,
                total_spent: 0,
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
                updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };
            
            await db.collection('customers').insertOne(newCustomer);
        }

        const newQuote = {
            quote_id: quote_id,
            customer_id: customerId,
            booking_id: booking_id,
            client_name: client_name,
            client_phone: client_phone,
            client_address: client_address,
            client_email: client_email,
            quote_date: quote_date,
            service_items: serviceItemsJson,
            subtotal: subtotal,
            tax_amount: tax_amount,
            total_amount: total_amount,
            tax_enabled: tax_enabled ? 1 : 0,
            status: 'draft',
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        const result = await db.collection('quotes').insertOne(newQuote);

        res.json({
            message: 'Quote created successfully',
            quote_id: quote_id,
            id: result.insertedId
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all quotes
app.get('/api/quotes', async (req, res) => {
    try {
        const quotes = await db.collection('quotes').aggregate([
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'booking_id',
                    foreignField: 'booking_id',
                    as: 'booking'
                }
            },
            {
                $addFields: {
                    booking_service: { $arrayElemAt: ['$booking.service', 0] },
                    booking_date: { $arrayElemAt: ['$booking.date', 0] },
                    booking_time: { $arrayElemAt: ['$booking.time', 0] }
                }
            },
            {
                $unset: 'booking'
            },
            {
                $sort: { created_at: -1 }
            }
        ]).toArray();
        
        // Parse service_items JSON for each quote
        quotes.forEach(quote => {
            try {
                quote.service_items = JSON.parse(quote.service_items);
            } catch (e) {
                quote.service_items = [];
            }
        });
        
        res.json(quotes);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get quote by ID
app.get('/api/quotes/:quoteId', async (req, res) => {
    try {
        const { quoteId } = req.params;

        const quotes = await db.collection('quotes').aggregate([
            {
                $match: { quote_id: quoteId }
            },
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'booking_id',
                    foreignField: 'booking_id',
                    as: 'booking'
                }
            },
            {
                $addFields: {
                    booking_service: { $arrayElemAt: ['$booking.service', 0] },
                    booking_date: { $arrayElemAt: ['$booking.date', 0] },
                    booking_time: { $arrayElemAt: ['$booking.time', 0] }
                }
            },
            {
                $unset: 'booking'
            }
        ]).toArray();

        if (quotes.length === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        const quote = quotes[0];

        // Parse service_items JSON
        try {
            quote.service_items = JSON.parse(quote.service_items);
        } catch (e) {
            quote.service_items = [];
        }

        res.json(quote);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update an existing quote
app.put('/api/quotes/:quoteId', async (req, res) => {
    try {
        const { quoteId } = req.params;
        const {
            booking_id,
            client_name,
            client_phone,
            client_address,
            client_email,
            quote_date,
            service_items,
            subtotal,
            tax_amount,
            total_amount,
            tax_enabled
        } = req.body;

        if (!booking_id || !client_name || !client_phone || !client_address || !client_email || !quote_date || !service_items) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const serviceItemsJson = JSON.stringify(service_items);

        const result = await db.collection('quotes').updateOne(
            { quote_id: quoteId },
            {
                $set: {
                    booking_id: booking_id,
                    client_name: client_name,
                    client_phone: client_phone,
                    client_address: client_address,
                    client_email: client_email,
                    quote_date: quote_date,
                    service_items: serviceItemsJson,
                    subtotal: subtotal,
                    tax_amount: tax_amount,
                    total_amount: total_amount,
                    tax_enabled: tax_enabled ? 1 : 0,
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        res.json({
            message: 'Quote updated successfully',
            quote_id: quoteId
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get quote by booking ID
app.get('/api/quotes/booking/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        const quotes = await db.collection('quotes').aggregate([
            {
                $match: { booking_id: bookingId }
            },
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'booking_id',
                    foreignField: 'booking_id',
                    as: 'booking'
                }
            },
            {
                $addFields: {
                    booking_service: { $arrayElemAt: ['$booking.service', 0] },
                    booking_date: { $arrayElemAt: ['$booking.date', 0] },
                    booking_time: { $arrayElemAt: ['$booking.time', 0] }
                }
            },
            {
                $unset: 'booking'
            },
            {
                $sort: { created_at: -1 }
            }
        ]).toArray();
        
        // Parse service_items JSON for each quote
        quotes.forEach(quote => {
            try {
                quote.service_items = JSON.parse(quote.service_items);
            } catch (e) {
                quote.service_items = [];
            }
        });
        
        res.json(quotes);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Send quote email
app.post('/api/quotes/:quoteId/email', async (req, res) => {
    try {
        const { quoteId } = req.params;
        
        // Get quote from database
        const quote = await db.collection('quotes').findOne({ quote_id: quoteId });
        
        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        
        // Parse service items
        let serviceItems = [];
        try {
            serviceItems = JSON.parse(quote.service_items);
        } catch (e) {
            serviceItems = [];
        }
        
        // Send email
        const emailContent = sendQuoteEmail(
            quote.client_email,
            quote.quote_id,
            quote.client_name,
            quote.quote_date,
            quote.total_amount,
            serviceItems
        );
        
        res.json({
            message: 'Quote email sent successfully',
            emailContent: emailContent
        });
    } catch (error) {
        console.error('Error sending quote email:', error);
        res.status(500).json({ error: 'Failed to send quote email' });
    }
});

// Invoices API endpoints

// Create invoice from quote
app.post('/api/invoices', async (req, res) => {
    try {
        const {
            quote_id,
            booking_id,
            client_name,
            client_phone,
            client_address,
            client_email,
            invoice_date,
            service_items,
            subtotal,
            tax_amount,
            total_amount,
            tax_enabled
        } = req.body;

        if (!quote_id || !booking_id || !client_name || !client_phone || !client_address || !client_email || !invoice_date || !service_items) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const invoice_id = generateUniqueId('INV');
        const serviceItemsJson = JSON.stringify(service_items);

        // Get the customer_id from the original booking
        const booking = await db.collection('bookings').findOne({ booking_id: booking_id });
        let customerId = null;
        
        if (booking && booking.customer_id) {
            customerId = booking.customer_id;
        } else {
            // Create a new customer if booking doesn't exist or has no customer_id
            customerId = generateUniqueId('CUST');
            const newCustomer = {
                customer_id: customerId,
                name: client_name,
                email: client_email,
                phone: client_phone,
                address: client_address,
                total_bookings: 0,
                total_spent: 0,
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
                updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };
            
            await db.collection('customers').insertOne(newCustomer);
        }

        const newInvoice = {
            invoice_id: invoice_id,
            customer_id: customerId,
            quote_id: quote_id,
            booking_id: booking_id,
            client_name: client_name,
            client_phone: client_phone,
            client_address: client_address,
            client_email: client_email,
            invoice_date: invoice_date,
            service_items: serviceItemsJson,
            subtotal: subtotal,
            tax_amount: tax_amount,
            total_amount: total_amount,
            tax_enabled: tax_enabled ? 1 : 0,
            payment_status: 'pending',
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        const result = await db.collection('invoices').insertOne(newInvoice);

        // Update customer total spent when invoice is created
        if (customerId) {
            try {
                await updateCustomerTotalSpent(customerId);
            } catch (error) {
                console.error('Error updating customer total spent:', error);
                // Don't fail the request, just log the error
            }
        }

        res.json({
            message: 'Invoice created successfully',
            invoice_id: invoice_id,
            id: result.insertedId
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get all invoices
app.get('/api/invoices', async (req, res) => {
    try {
        const invoices = await db.collection('invoices').aggregate([
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'booking_id',
                    foreignField: 'booking_id',
                    as: 'booking'
                }
            },
            {
                $lookup: {
                    from: 'quotes',
                    localField: 'quote_id',
                    foreignField: 'quote_id',
                    as: 'quote'
                }
            },
            {
                $addFields: {
                    booking_service: { $arrayElemAt: ['$booking.service', 0] },
                    booking_date: { $arrayElemAt: ['$booking.date', 0] },
                    booking_time: { $arrayElemAt: ['$booking.time', 0] },
                    original_quote_id: { $arrayElemAt: ['$quote.quote_id', 0] }
                }
            },
            {
                $unset: ['booking', 'quote']
            },
            {
                $sort: { created_at: -1 }
            }
        ]).toArray();
        
        // Parse service_items JSON for each invoice
        invoices.forEach(invoice => {
            try {
                invoice.service_items = JSON.parse(invoice.service_items);
            } catch (e) {
                invoice.service_items = [];
            }
        });
        
        res.json(invoices);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get invoice by ID
app.get('/api/invoices/:invoiceId', async (req, res) => {
    try {
        const { invoiceId } = req.params;
        
        const invoices = await db.collection('invoices').aggregate([
            {
                $match: { invoice_id: invoiceId }
            },
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'booking_id',
                    foreignField: 'booking_id',
                    as: 'booking'
                }
            },
            {
                $lookup: {
                    from: 'quotes',
                    localField: 'quote_id',
                    foreignField: 'quote_id',
                    as: 'quote'
                }
            },
            {
                $addFields: {
                    booking_service: { $arrayElemAt: ['$booking.service', 0] },
                    booking_date: { $arrayElemAt: ['$booking.date', 0] },
                    booking_time: { $arrayElemAt: ['$booking.time', 0] },
                    original_quote_id: { $arrayElemAt: ['$quote.quote_id', 0] }
                }
            },
            {
                $unset: ['booking', 'quote']
            }
        ]).toArray();
        
        if (invoices.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        const invoice = invoices[0];
        
        // Parse service_items JSON
        try {
            invoice.service_items = JSON.parse(invoice.service_items);
        } catch (e) {
            invoice.service_items = [];
        }
        
        res.json(invoice);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update invoice payment status
app.patch('/api/invoices/:invoiceId/payment', async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const { payment_status } = req.body;

        if (!payment_status || !['paid', 'unpaid', 'partial'].includes(payment_status)) {
            return res.status(400).json({ error: 'Invalid payment status' });
        }

        // First, get the customer_id for this invoice
        const invoice = await db.collection('invoices').findOne({ invoice_id: invoiceId });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const result = await db.collection('invoices').updateOne(
            { invoice_id: invoiceId },
            {
                $set: {
                    payment_status: payment_status,
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // If invoice is paid, update customer total spent
        if (payment_status === 'paid' && invoice.customer_id) {
            try {
                await updateCustomerTotalSpent(invoice.customer_id);
            } catch (error) {
                console.error('Error updating customer total spent:', error);
                // Don't fail the request, just log the error
            }
        }

        res.json({ message: 'Payment status updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Send invoice email
app.post('/api/invoices/:invoiceId/email', async (req, res) => {
    try {
        const { invoiceId } = req.params;
        
        // Get invoice from database
        const invoice = await db.collection('invoices').findOne({ invoice_id: invoiceId });
        
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        // Parse service items
        let serviceItems = [];
        try {
            serviceItems = JSON.parse(invoice.service_items);
        } catch (e) {
            serviceItems = [];
        }
        
        // Send email
        const emailContent = sendInvoiceEmail(
            invoice.client_email,
            invoice.invoice_id,
            invoice.client_name,
            invoice.invoice_date,
            invoice.total_amount,
            serviceItems
        );
        
        res.json({
            message: 'Invoice email sent successfully',
            emailContent: emailContent
        });
    } catch (error) {
        console.error('Error sending invoice email:', error);
        res.status(500).json({ error: 'Failed to send invoice email' });
    }
});

// Customer Management API Endpoints

// Get all customers with their statistics (admin only)
app.get('/api/customers', requireAdminAuth, async (req, res) => {
    try {
        const customers = await db.collection('customers').aggregate([
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'customer_id',
                    foreignField: 'customer_id',
                    as: 'bookings'
                }
            },
            {
                $lookup: {
                    from: 'quotes',
                    localField: 'customer_id',
                    foreignField: 'customer_id',
                    as: 'quotes'
                }
            },
            {
                $lookup: {
                    from: 'invoices',
                    localField: 'customer_id',
                    foreignField: 'customer_id',
                    as: 'invoices'
                }
            },
            {
                $addFields: {
                    total_bookings_calc: { $size: '$bookings' },
                    total_quotes: { $size: '$quotes' },
                    total_invoices: { $size: '$invoices' },
                    total_paid: {
                        $sum: {
                            $map: {
                                input: '$invoices',
                                as: 'invoice',
                                in: {
                                    $cond: {
                                        if: { $eq: ['$$invoice.payment_status', 'paid'] },
                                        then: '$$invoice.total_amount',
                                        else: 0
                                    }
                                }
                            }
                        }
                    },
                    total_unpaid: {
                        $sum: {
                            $map: {
                                input: '$invoices',
                                as: 'invoice',
                                in: {
                                    $cond: {
                                        if: { $eq: ['$$invoice.payment_status', 'unpaid'] },
                                        then: '$$invoice.total_amount',
                                        else: 0
                                    }
                                }
                            }
                        }
                    },
                    first_booking_date_calc: { $min: '$bookings.date' },
                    last_booking_date_calc: { $max: '$bookings.date' }
                }
            },
            {
                $sort: { name: 1 }
            }
        ]).toArray();
        
        res.json(customers);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get customer by ID with detailed information
app.get('/api/customers/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        
        // Get customer details
        const customer = await db.collection('customers').findOne({ customer_id: customerId });
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Get customer's bookings
        const bookings = await db.collection('bookings')
            .find({ customer_id: customerId })
            .sort({ date: -1, time: -1 })
            .toArray();
        
        // Get customer's quotes
        const quotes = await db.collection('quotes')
            .find({ customer_id: customerId })
            .sort({ created_at: -1 })
            .toArray();
        
        // Get customer's invoices
        const invoices = await db.collection('invoices')
            .find({ customer_id: customerId })
            .sort({ created_at: -1 })
            .toArray();
        
        // Calculate total breakdown for debugging
        const allInvoices = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const paidInvoices = invoices.filter(inv => inv.payment_status === 'paid');
        const totalFromPaidInvoices = paidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const completedBookingsWithoutInvoices = bookings.filter(b => 
            b.status === 'completed' && 
            !invoices.some(inv => inv.booking_id === b.booking_id)
        );
        const estimatedTotal = completedBookingsWithoutInvoices.length * 200;
        const calculatedTotal = allInvoices + estimatedTotal;
        
        res.json({
            customer,
            bookings,
            quotes,
            invoices,
            calculatedTotal: totalFromPaidInvoices,
            storedTotal: customer.total_spent
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});


// Create or update customer (based on phone number)
app.post('/api/customers', async (req, res) => {
    try {
        const { name, email, phone, address, notes } = req.body;
        
        if (!name || !email || !phone) {
            return res.status(400).json({ error: 'Name, email, and phone are required' });
        }
        
        // Check if customer already exists by phone number
        const existingCustomer = await db.collection('customers').findOne({ phone: phone });
        
        if (existingCustomer) {
            // Update existing customer
            await db.collection('customers').updateOne(
                { phone: phone },
                {
                    $set: {
                        name: name,
                        email: email,
                        address: address || '',
                        notes: notes || '',
                        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                    }
                }
            );
            
            res.json({
                message: 'Customer updated successfully',
                customer: { ...existingCustomer, name, email, address, notes }
            });
        } else {
            // Create new customer
            const customerId = generateUniqueId('CUST');
            const newCustomer = {
                customer_id: customerId,
                name: name,
                email: email,
                phone: phone,
                address: address || '',
                notes: notes || '',
                total_bookings: 0,
                total_spent: 0,
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
                updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };
            
            await db.collection('customers').insertOne(newCustomer);
            
            res.status(201).json({
                message: 'Customer created successfully',
                customer: {
                    customer_id: customerId,
                    name,
                    email,
                    phone,
                    address,
                    notes
                }
            });
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update customer
app.put('/api/customers/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const { name, email, phone, address, notes } = req.body;
        
        if (!name || !email || !phone) {
            return res.status(400).json({ error: 'Name, email, and phone are required' });
        }
        
        const result = await db.collection('customers').updateOne(
            { customer_id: customerId },
            {
                $set: {
                    name: name,
                    email: email,
                    phone: phone,
                    address: address || '',
                    notes: notes || '',
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                }
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        res.json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete customer
app.delete('/api/customers/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const { force } = req.query; // Check for force parameter
        
        // Check if customer has any bookings, quotes, or invoices
        const bookingCount = await db.collection('bookings').countDocuments({ customer_id: customerId });
        const quoteCount = await db.collection('quotes').countDocuments({ customer_id: customerId });
        const invoiceCount = await db.collection('invoices').countDocuments({ customer_id: customerId });
        
        const counts = {
            booking_count: bookingCount,
            quote_count: quoteCount,
            invoice_count: invoiceCount
        };
        
        // If force delete is not enabled and customer has data, prevent deletion
        if (!force && (counts.booking_count > 0 || counts.quote_count > 0 || counts.invoice_count > 0)) {
            return res.status(400).json({ 
                error: 'Cannot delete customer with existing bookings, quotes, or invoices. Use ?force=true to force delete.',
                hasData: true,
                counts: counts
            });
        }
        
        // If force delete is enabled, delete all associated data first
        if (force) {
            // Delete in order: invoices -> quotes -> bookings -> customer
            await db.collection('invoices').deleteMany({ customer_id: customerId });
            await db.collection('quotes').deleteMany({ customer_id: customerId });
            await db.collection('bookings').deleteMany({ customer_id: customerId });
            
            // Finally delete the customer
            const result = await db.collection('customers').deleteOne({ customer_id: customerId });
            
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            
            res.json({ 
                message: 'Customer and all associated data deleted successfully',
                deletedCounts: counts
            });
        } else {
            // Normal delete (no associated data)
            const result = await db.collection('customers').deleteOne({ customer_id: customerId });
            
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            
            res.json({ message: 'Customer deleted successfully' });
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Search customers
app.get('/api/customers/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const searchTerm = query;
        
        const customers = await db.collection('customers').aggregate([
            {
                $match: {
                    $or: [
                        { name: { $regex: searchTerm, $options: 'i' } },
                        { email: { $regex: searchTerm, $options: 'i' } },
                        { phone: { $regex: searchTerm, $options: 'i' } },
                        { address: { $regex: searchTerm, $options: 'i' } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'bookings',
                    localField: 'customer_id',
                    foreignField: 'customer_id',
                    as: 'bookings'
                }
            },
            {
                $lookup: {
                    from: 'quotes',
                    localField: 'customer_id',
                    foreignField: 'customer_id',
                    as: 'quotes'
                }
            },
            {
                $lookup: {
                    from: 'invoices',
                    localField: 'customer_id',
                    foreignField: 'customer_id',
                    as: 'invoices'
                }
            },
            {
                $addFields: {
                    total_bookings: { $size: '$bookings' },
                    total_quotes: { $size: '$quotes' },
                    total_invoices: { $size: '$invoices' },
                    total_paid: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$invoices',
                                        cond: { $eq: ['$$this.payment_status', 'paid'] }
                                    }
                                },
                                in: '$$this.total_amount'
                            }
                        }
                    },
                    total_unpaid: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$invoices',
                                        cond: { $ne: ['$$this.payment_status', 'paid'] }
                                    }
                                },
                                in: '$$this.total_amount'
                            }
                        }
                    }
                }
            },
            {
                $unset: ['bookings', 'quotes', 'invoices']
            },
            {
                $sort: { name: 1 }
            }
        ]).toArray();
        
        res.json(customers);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Link existing bookings to customers (migration function)
app.post('/api/customers/migrate', async (req, res) => {
    try {
        const bookings = await db.collection('bookings').aggregate([
            {
                $match: {
                    phone: { $ne: null, $ne: '' }
                }
            },
            {
                $group: {
                    _id: '$phone',
                    name: { $first: '$name' },
                    email: { $first: '$email' },
                    address: { $first: '$address' },
                    phone: { $first: '$phone' }
                }
            },
            {
                $sort: { phone: 1 }
            }
        ]).toArray();
        
        let processed = 0;
        let errors = 0;
        
        for (const booking of bookings) {
            try {
                // Check if customer already exists
                const existing = await db.collection('customers').findOne({ phone: booking.phone });
                
                if (!existing) {
                    // Create new customer
                    const customerId = generateUniqueId('CUST');
                    const newCustomer = {
                        customer_id: customerId,
                        name: booking.name,
                        email: booking.email,
                        phone: booking.phone,
                        address: booking.address || '',
                        total_bookings: 0,
                        total_spent: 0,
                        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
                        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                    };
                    
                    await db.collection('customers').insertOne(newCustomer);
                    
                    // Update bookings with customer_id
                    await db.collection('bookings').updateMany(
                        { phone: booking.phone },
                        { $set: { customer_id: customerId } }
                    );
                    
                    processed++;
                } else {
                    // Update existing bookings with customer_id
                    await db.collection('bookings').updateMany(
                        { phone: booking.phone },
                        { $set: { customer_id: existing.customer_id } }
                    );
                    
                    processed++;
                }
            } catch (error) {
                console.error('Error processing booking:', error);
                errors++;
            }
        }
        
        res.json({ 
            message: 'Migration completed', 
            processed, 
            errors 
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Email confirmation function (placeholder)
function sendConfirmationEmail(email, bookingId, service, date, time, name) {
    // This is a placeholder for email functionality
    // In a real implementation, you would use a service like SendGrid, Mailgun, or AWS SES
    console.log(`Confirmation email would be sent to ${email} for booking ${bookingId}`);
    console.log(`Service: ${service}, Date: ${date}, Time: ${time}, Name: ${name}`);
    
    // Example email content:
    const emailContent = {
        to: email,
        subject: `Booking Confirmation - ${bookingId}`,
        body: `
            Dear ${name},
            
            Thank you for booking with Stellar Tree Management!
            
            Booking Details:
            - Booking ID: ${bookingId}
            - Service: ${service}
            - Date: ${date}
            - Time: ${time}
            
            We will contact you within 24 hours to confirm your appointment.
            
            Best regards,
            Stellar Tree Management Team
        `
    };
    
    // Here you would integrate with your email service
    // For now, we'll just log it
    console.log('Email content:', emailContent);
}

// Email quote function (placeholder)
function sendQuoteEmail(email, quoteId, clientName, quoteDate, totalAmount, serviceItems) {
    // This is a placeholder for email functionality
    // In a real implementation, you would use a service like SendGrid, Mailgun, or AWS SES
    console.log(`Quote email would be sent to ${email} for quote ${quoteId}`);
    
    // Format service items for email
    const serviceItemsList = serviceItems.map(item => 
        `- ${item.description}: ${item.quantity} x $${item.price.toFixed(2)} = $${item.total.toFixed(2)}`
    ).join('\n');
    
    // Example email content:
    const emailContent = {
        from: 'stellartmanagement@outlook.com',
        to: email,
        subject: `Quote - ${quoteId}`,
        body: `
            Dear ${clientName},
            
            Thank you for your interest in Stellar Tree Management services!
            
            Please find your quote details below:
            
            Quote ID: ${quoteId}
            Date: ${quoteDate}
            
            Service Items:
            ${serviceItemsList}
            
            Total Amount: $${totalAmount.toFixed(2)}
            
            Please review this quote and contact us if you have any questions.
            
            Best regards,
            Stellar Tree Management Team
            Email: stellartmanagement@outlook.com
        `
    };
    
    // Here you would integrate with your email service
    // For now, we'll just log it
    console.log('Quote email content:', emailContent);
    return emailContent;
}

// Email invoice function (placeholder)
function sendInvoiceEmail(email, invoiceId, clientName, invoiceDate, totalAmount, serviceItems) {
    // This is a placeholder for email functionality
    // In a real implementation, you would use a service like SendGrid, Mailgun, or AWS SES
    console.log(`Invoice email would be sent to ${email} for invoice ${invoiceId}`);
    
    // Format service items for email
    const serviceItemsList = serviceItems.map(item => 
        `- ${item.description}: ${item.quantity} x $${item.price.toFixed(2)} = $${item.total.toFixed(2)}`
    ).join('\n');
    
    // Example email content:
    const emailContent = {
        from: 'stellartmanagement@outlook.com',
        to: email,
        subject: `Invoice - ${invoiceId}`,
        body: `
            Dear ${clientName},
            
            Please find your invoice from Stellar Tree Management below:
            
            Invoice ID: ${invoiceId}
            Date: ${invoiceDate}
            
            Service Items:
            ${serviceItemsList}
            
            Total Amount: $${totalAmount.toFixed(2)}
            
            Please remit payment as soon as possible. Thank you for your business!
            
            Best regards,
            Stellar Tree Management Team
            Email: stellartmanagement@outlook.com
        `
    };
    
    // Here you would integrate with your email service
    // For now, we'll just log it
    console.log('Invoice email content:', emailContent);
    return emailContent;
}

// Email booking confirmation function with unique link
function sendBookingConfirmationEmail(email, bookingId, service, date, time, name) {
    // This is a placeholder for email functionality
    // In a real implementation, you would use a service like SendGrid, Mailgun, or AWS SES
    console.log(`Booking confirmation email would be sent to ${email} for booking ${bookingId}`);
    console.log(`Service: ${service}, Date: ${date}, Time: ${time}, Name: ${name}`);
    
    // Create unique booking link
    const bookingLink = `https://stellartreemanagement.ca/${bookingId}`;
    
    // Example email content:
    const emailContent = {
        from: 'stellartmanagement@outlook.com',
        to: email,
        subject: `Booking Request Confirmed - ${bookingId}`,
        body: `
            Dear ${name},
            
            Your booking request has been confirmed by Stellar Tree Management!
            
            Booking Details:
            - Booking ID: ${bookingId}
            - Service: ${service}
            - Date: ${date}
            - Time: ${time}
            
            To confirm your booking and view your booking status, please visit:
            ${bookingLink}
            
            This link will allow you to:
            - View your booking details
            - Confirm your booking
            - Track the progress of your service
            
            Please click the link above to confirm your booking within 24 hours.
            
            If you have any questions, please contact us at stellartmanagement@outlook.com
            
            Best regards,
            Stellar Tree Management Team
        `
    };
    
    // Here you would integrate with your email service
    // For now, we'll just log it
    console.log('Booking confirmation email content:', emailContent);
    return emailContent;
}

// Email final booking confirmation function
// Email booking final confirmation function
function sendBookingFinalConfirmationEmail(email, bookingId, service, date, time, name) {
    // This is a placeholder for email functionality
    // In a real implementation, you would use a service like SendGrid, Mailgun, or AWS SES
    console.log(`Final booking confirmation email would be sent to ${email} for booking ${bookingId}`);
    console.log(`Service: ${service}, Date: ${date}, Time: ${time}, Name: ${name}`);
    
    // Example email content:
    const emailContent = {
        from: 'stellartmanagement@outlook.com',
        to: email,
        subject: `Booking Confirmed - ${bookingId}`,
        body: `
            Dear ${name},
            
            Your booking is now confirmed! Thank you for choosing Stellar Tree Management.
            
            Booking Details:
            - Booking ID: ${bookingId}
            - Service: ${service}
            - Date: ${date}
            - Time: ${time}
            
            We look forward to providing you with excellent service.
            
            If you have any questions or need to make changes, please contact us at stellartmanagement@outlook.com
            
            Best regards,
            Stellar Tree Management Team
        `
    };
    
    // Here you would integrate with your email service
    // For now, we'll just log it
    console.log('Final booking confirmation email content:', emailContent);
    return emailContent;
}

// Function to update customer total spent
async function updateCustomerTotalSpent(customerId) {
    try {
        // Calculate total from completed bookings
        const bookingStats = await db.collection('bookings').aggregate([
            { $match: { customer_id: customerId } },
            {
                $group: {
                    _id: null,
                    total_bookings: { $sum: 1 },
                    completed_bookings: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    }
                }
            }
        ]).toArray();
        
        const totalBookings = bookingStats.length > 0 ? bookingStats[0].total_bookings : 0;
        
        // Calculate total from all invoices (both paid and unpaid)
        const invoiceStats = await db.collection('invoices').aggregate([
            { $match: { customer_id: customerId } },
            { $group: { _id: null, total_paid: { $sum: '$total_amount' } } }
        ]).toArray();
        
        const invoiceTotal = invoiceStats.length > 0 ? invoiceStats[0].total_paid : 0;
        
        // Calculate total from quotes that have been converted to invoices
        const quoteStats = await db.collection('quotes').aggregate([
            { $match: { customer_id: customerId } },
            {
                $lookup: {
                    from: 'invoices',
                    localField: 'quote_id',
                    foreignField: 'quote_id',
                    as: 'invoices'
                }
            },
            { $match: { invoices: { $size: 0 } } },
            { $group: { _id: null, total_quotes: { $sum: '$total_amount' } } }
        ]).toArray();
        
        const quoteTotal = quoteStats.length > 0 ? quoteStats[0].total_quotes : 0;
        
        // Check if there are completed bookings that don't have corresponding invoices
        const completedWithoutInvoices = await db.collection('bookings').aggregate([
            { $match: { customer_id: customerId, status: 'completed' } },
            {
                $lookup: {
                    from: 'invoices',
                    localField: 'booking_id',
                    foreignField: 'booking_id',
                    as: 'invoices'
                }
            },
            { $match: { invoices: { $size: 0 } } },
            { $count: 'count' }
        ]).toArray();
        
        // Only add default cost for completed bookings that don't have invoices
        const defaultServiceCost = 200.00;
        const bookingTotal = (completedWithoutInvoices.length > 0 ? completedWithoutInvoices[0].count : 0) * defaultServiceCost;
        
        // Total spent should primarily come from invoices
        // Only add estimated cost for completed bookings that don't have invoices
        const totalSpent = invoiceTotal + bookingTotal;
        
        // Debug logging
        console.log(`Customer ${customerId} calculation breakdown:`);
        console.log(`- Invoice total: $${invoiceTotal.toFixed(2)}`);
        console.log(`- Completed bookings without invoices: ${completedWithoutInvoices.length > 0 ? completedWithoutInvoices[0].count : 0}`);
        console.log(`- Booking total (estimated): $${bookingTotal.toFixed(2)}`);
        console.log(`- Final total: $${totalSpent.toFixed(2)}`);
        
        // Update customer record
        await db.collection('customers').updateOne(
            { customer_id: customerId },
            {
                $set: {
                    total_spent: totalSpent,
                    total_bookings: totalBookings,
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                }
            }
        );
        
        console.log(`Updated customer ${customerId} total_spent to $${totalSpent.toFixed(2)}`);
        return totalSpent;
    } catch (error) {
        console.error('Error updating customer total spent:', error);
        throw error;
    }
}

// Recalculate all customer total spent (admin utility)
app.post('/api/customers/recalculate-totals', async (req, res) => {
    try {
        const customers = await db.collection('customers').find({}, { customer_id: 1 }).toArray();
        
        let completed = 0;
        let errors = 0;
        
        for (const customer of customers) {
            try {
                await updateCustomerTotalSpent(customer.customer_id);
                completed++;
            } catch (error) {
                console.error(`Error updating customer ${customer.customer_id}:`, error);
                errors++;
            }
        }
        
        res.json({ 
            message: `Recalculation completed. Updated ${completed} customers, ${errors} errors.` 
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Recalculate specific customer total spent
app.post('/api/customers/:customerId/recalculate-total', async (req, res) => {
    try {
        const { customerId } = req.params;
        
        const totalSpent = await updateCustomerTotalSpent(customerId);
        
        res.json({ 
            message: `Customer total recalculated successfully. New total: $${totalSpent.toFixed(2)}`,
            totalSpent: totalSpent
        });
    } catch (error) {
        console.error(`Error updating customer ${req.params.customerId}:`, error);
        res.status(500).json({ error: 'Failed to recalculate customer total' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    try {
        await closeConnection();
        console.log('Database connection closed.');
    } catch (error) {
        console.error('Error closing database:', error);
    }
    process.exit(0);
});


// Add this right after the middleware section (around line 12)
// Domain handling middleware
app.use((req, res, next) => {
    // Log the hostname for debugging
    console.log('Request hostname:', req.hostname);
    
    // Handle both www and non-www versions
    if (req.hostname === 'stellartreemanagement.ca') {
        // Option 1: Redirect to www version (recommended for SEO)
        return res.redirect(301, `https://www.stellartreemanagement.ca${req.url}`);
        
        // Option 2: Or serve the same content without redirect
        // next();
    }
    next();
});

// Serve booking status page for specific booking IDs
app.get('/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;
    
    // Check if it's a valid booking ID format (you can customize this validation)
    if (bookingId && bookingId.length > 0 && !bookingId.includes('.')) {
        res.sendFile(path.join(__dirname, 'booking-status.html'));
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Add a catch-all route for client-side routing (add this near the end of your routes)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Utility function to clean up orphaned images (admin only)
app.post('/api/cleanup-images', requireAdminAuth, async (req, res) => {
    try {
        // Get all images from MongoDB
        const allImages = await db.collection('images').find().toArray();
        
        // Get all image paths from bookings
        const bookings = await db.collection('bookings').find({ images: { $ne: null, $ne: '' } }).toArray();
        const referencedImageIds = new Set();
        
        for (const booking of bookings) {
            try {
                const imagePaths = JSON.parse(booking.images || '[]');
                for (const imagePath of imagePaths) {
                    const imageId = imagePath.split('/').pop(); // Extract ID from path
                    referencedImageIds.add(imageId);
                }
            } catch (error) {
                console.error(`Error parsing images for booking ${booking.booking_id}:`, error);
            }
        }
        
        // Find orphaned images
        const orphanedImages = allImages.filter(img => !referencedImageIds.has(img._id.toString()));
        
        // Delete orphaned images
        let deletedCount = 0;
        let deletedSize = 0;
        
        for (const image of orphanedImages) {
            try {
                await db.collection('images').deleteOne({ _id: image._id });
                deletedCount++;
                deletedSize += image.size || 0;
                console.log(`🗑️ Deleted orphaned image: ${image._id}`);
            } catch (error) {
                console.error(`Error deleting image ${image._id}:`, error);
            }
        }
        
        res.json({
            message: 'Image cleanup completed',
            totalImages: allImages.length,
            referencedImages: referencedImageIds.size,
            orphanedImages: orphanedImages.length,
            deletedImages: deletedCount,
            deletedSize: `${(deletedSize / 1024 / 1024).toFixed(2)} MB`
        });
    } catch (error) {
        console.error('Error cleaning up images:', error);
        res.status(500).json({ error: 'Failed to cleanup images' });
    }
});

// Start the server
startServer();

module.exports = app;