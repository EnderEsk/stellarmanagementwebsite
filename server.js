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
app.use('/api/bookings/stats/overview', express.json());
// Customer management middleware - REMOVED

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
        return '5:30 PM'; // Default to evening slot
    }
    
    // Handle abbreviated formats (8am, 1pm, 4pm)
    const timeLower = time.toLowerCase();
    if (timeLower === '8am') return '5:30 PM';
    if (timeLower === '1pm') return '6:30 PM';
    if (timeLower === '4pm') return '7:30 PM';
    
    // Handle 24-hour format (e.g., "17:30", "18:30", "19:30")
    if (time.includes(':')) {
        const [hours, minutes] = time.split(':').map(Number);
        if (hours === 17 && minutes === 30) return '5:30 PM';
        if (hours === 18 && minutes === 30) return '6:30 PM';
        if (hours === 19 && minutes === 30) return '7:30 PM';
        // Handle legacy time formats for backward compatibility
        if (hours === 8) return '5:30 PM';
        if (hours === 13) return '6:30 PM';
        if (hours === 16) return '7:30 PM';
        if (hours === 14) return '6:30 PM'; // 14:00 = 2 PM, but we'll map to 6:30 PM
        if (hours === 15) return '7:30 PM'; // 15:00 = 3 PM, but we'll map to 7:30 PM
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
                status: { $in: ['pending', 'quote-ready', 'quote-sent', 'quote-accepted', 'confirmed', 'pending-booking'] }
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
        const validTimes = ['5:30 PM', '6:30 PM', '7:30 PM'];
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
            status: { $in: ['pending', 'quote-ready', 'quote-sent', 'quote-accepted', 'confirmed', 'pending-booking'] }
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
        // Parse date string as local date to avoid timezone issues
        const [year, month, day] = cleanedData.date.split('-').map(Number);
        const bookingDate = new Date(year, month - 1, day); // month is 0-indexed
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
        // Use the same parsed date to avoid timezone issues
        const bookingDateOnly = new Date(year, month - 1, day);
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
            status: { $in: ['pending', 'quote-ready', 'quote-sent', 'quote-accepted', 'confirmed', 'pending-booking'] }
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
            status: { $in: ['pending', 'quote-ready', 'quote-sent', 'quote-accepted', 'confirmed', 'pending-booking'] }
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

        // Customer management - REMOVED

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

        // Insert new booking with images
        const newBooking = {
            booking_id: cleanedData.booking_id,
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

        // Send automatic quote request confirmation email to customer
        try {
            const EmailService = require('./email-service');
            const emailService = new EmailService();
            
            const emailResult = await emailService.sendQuoteRequestConfirmationEmail(
                cleanedData.email,
                cleanedData.booking_id,
                cleanedData.service,
                cleanedData.date,
                cleanedData.time,
                cleanedData.name,
                cleanedData.address,
                cleanedData.notes
            );
            
            if (emailResult.success) {
                console.log(`📧 Quote request confirmation email sent successfully to ${cleanedData.email}`);
            } else {
                console.error(`❌ Failed to send quote request confirmation email:`, emailResult.error);
            }
        } catch (emailError) {
            console.error('❌ Error sending quote request confirmation email:', emailError);
            // Don't fail the booking creation if email fails
        }

        // Send notification email to Stellar Tree Management about new booking
        try {
            const EmailService = require('./email-service');
            const emailService = new EmailService();
            
            const adminNotificationResult = await emailService.sendNewBookingNotificationEmail(
                process.env.ADMIN_EMAIL || 'stellartmanagement@outlook.com',
                cleanedData.booking_id,
                cleanedData.service,
                cleanedData.date,
                cleanedData.time,
                cleanedData.name,
                cleanedData.email,
                cleanedData.phone,
                cleanedData.address,
                cleanedData.notes
            );
            
            if (adminNotificationResult.success) {
                console.log(`📧 New booking notification email sent successfully to admin`);
            } else {
                console.error(`❌ Failed to send new booking notification email:`, adminNotificationResult.error);
            }
        } catch (adminEmailError) {
            console.error('❌ Error sending new booking notification email:', adminEmailError);
            // Don't fail the booking creation if admin email fails
        }

        res.status(201).json({
            message: 'Booking created successfully',
            bookingId: cleanedData.booking_id,
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

        console.log(`🔄 Updating booking ${bookingId} status to: ${status}`);
        console.log(`🔍 Request body:`, req.body);
        console.log(`🔍 Request headers:`, req.headers);
        console.log(`🔍 Content-Type:`, req.headers['content-type']);
        console.log(`🔍 Authorization:`, req.headers.authorization ? 'Present' : 'Missing');

        if (!status || !['pending', 'pending-site-visit', 'quote-ready', 'quote-sent', 'quote-accepted', 'confirmed', 'pending-booking', 'invoice-ready', 'invoice-sent', 'cancelled', 'completed'].includes(status)) {
            console.log(`❌ Invalid status: ${status}`);
            return res.status(500).json({ error: 'Invalid status' });
        }

        // First, get the customer_id for this booking
        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
        
        if (!booking) {
            console.log(`❌ Booking not found: ${bookingId}`);
            return res.status(404).json({ error: 'Booking not found' });
        }

        console.log(`✅ Found booking: ${bookingId}, current status: ${booking.status}`);

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
            console.log(`❌ No booking updated: ${bookingId}`);
            return res.status(404).json({ error: 'Booking not found' });
        }

        console.log(`✅ Successfully updated booking ${bookingId} status to ${status}`);

        // Customer total spent update - REMOVED

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

// Send invoice to customer (admin only)
app.post('/api/bookings/:bookingId/send-invoice', requireAdminAuth, async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Get booking details
        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Import and use EmailService
        const EmailService = require('./email-service');
        const emailService = new EmailService();
        
        // Get the actual invoice data for this booking
        const invoices = await db.collection('invoices').find({ booking_id: bookingId }).toArray();
        let invoiceData = null;
        let totalAmount = 'TBD';
        let serviceItems = [];
        
        if (invoices.length > 0) {
            // Get the most recent invoice
            invoiceData = invoices[invoices.length - 1];
            totalAmount = `$${parseFloat(invoiceData.total_amount).toFixed(2)}`;
            
            try {
                serviceItems = JSON.parse(invoiceData.service_items);
            } catch (e) {
                serviceItems = [];
            }
        }
        
        // Send invoice email to customer
        const result = await emailService.sendInvoiceEmail(
            booking.email, 
            bookingId, 
            booking.service, 
            totalAmount,
            booking.work_description || booking.notes || 'Tree service as requested',
            booking.name,
            booking.address || '',
            booking.notes || '',
            serviceItems
        );

        if (result.success) {
            // Update booking status to 'invoice-sent'
            await db.collection('bookings').updateOne(
                { booking_id: bookingId },
                { 
                    $set: { 
                        status: 'invoice-sent',
                        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                    } 
                }
            );

            console.log('📧 Invoice sent to customer successfully');
            res.json({
                message: 'Invoice sent to customer successfully',
                messageId: result.messageId
            });
        } else {
            console.error('📧 Failed to send invoice to customer:', result.error);
            res.status(500).json({
                error: 'Failed to send invoice to customer',
                details: result.error
            });
        }
    } catch (error) {
        console.error('Error sending invoice to customer:', error);
        res.status(500).json({ error: 'Failed to send invoice to customer' });
    }
});

// Create invoice from booking (admin only)
app.post('/api/bookings/:bookingId/create-invoice', requireAdminAuth, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const {
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

        if (!client_name || !client_phone || !client_address || !client_email || !invoice_date || !service_items) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get the booking to verify it exists and get customer info
        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const invoice_id = generateUniqueId('INV');
        const serviceItemsJson = JSON.stringify(service_items);

        // Customer management - REMOVED

        const newInvoice = {
            invoice_id: invoice_id,
            quote_id: null, // No quote associated when creating directly from booking
            booking_id: bookingId,
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

        // Customer total spent update - REMOVED

        // Update booking status to 'invoice-ready'
        await db.collection('bookings').updateOne(
            { booking_id: bookingId },
            { 
                $set: { 
                    status: 'invoice-ready',
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                } 
            }
        );

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

// Send quote to customer (admin only)
app.post('/api/bookings/:bookingId/send-quote', requireAdminAuth, async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Get booking details
        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Try to get the actual quote cost from the quotes collection
        let actualCost = 'TBD';
        let workDescription = 'Tree service as requested';
        
        try {
            const quotes = await db.collection('quotes').find({ booking_id: bookingId }).sort({ created_at: -1 }).limit(1).toArray();
            if (quotes.length > 0) {
                const latestQuote = quotes[0];
                if (latestQuote.total_amount) {
                    actualCost = latestQuote.total_amount;
                    console.log(`✅ Found quote cost: $${actualCost}`);
                }
                if (latestQuote.work_description && latestQuote.work_description.trim() !== 't') {
                    workDescription = latestQuote.work_description;
                }
            }
        } catch (quoteError) {
            console.log('⚠️ Could not fetch quote data, using booking data');
        }

        // Import and use EmailService
        const EmailService = require('./email-service');
        const emailService = new EmailService();
        
        // Send quote email using the same comprehensive template as the quote preview
        // This ensures both quote sending mechanisms use the exact same email template
        
        // Get quote data to send the comprehensive email
        let quoteData = null;
        let serviceItems = [];
        
        try {
            const quotes = await db.collection('quotes').find({ booking_id: bookingId }).sort({ created_at: -1 }).limit(1).toArray();
            if (quotes.length > 0) {
                quoteData = quotes[0];
                // Parse service items
                try {
                    serviceItems = JSON.parse(quoteData.service_items);
                } catch (e) {
                    serviceItems = [];
                }
            }
        } catch (quoteError) {
            console.log('⚠️ Could not fetch quote data, using basic service structure');
            // Create basic service structure if no quote exists
            serviceItems = [{
                description: booking.service || 'Tree service as requested',
                quantity: 1,
                price: actualCost === 'TBD' ? 0 : parseFloat(actualCost),
                total: actualCost === 'TBD' ? 0 : parseFloat(actualCost)
            }];
        }
        
        // Generate a quote ID if none exists
        const quoteId = quoteData ? quoteData.quote_id : `QT-${Date.now()}`;
        const quoteDate = quoteData ? quoteData.quote_date : new Date().toISOString().split('T')[0];
        const totalAmount = actualCost === 'TBD' ? 0 : parseFloat(actualCost);
        
        const result = await emailService.sendQuoteEmail(
            booking.email, 
            quoteId,
            booking.name,
            quoteDate,
            totalAmount,
            serviceItems,
            bookingId
        );

        if (result.success) {
            // Update booking status to 'quote-sent'
            await db.collection('bookings').updateOne(
                { booking_id: bookingId },
                { 
                    $set: { 
                        status: 'quote-sent',
                        updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                    } 
                }
            );

            console.log('📧 Quote sent to customer successfully');
            res.json({
                message: 'Quote sent to customer successfully',
                messageId: result.messageId
            });
        } else {
            console.error('📧 Failed to send quote to customer:', result.error);
            res.status(500).json({
                error: 'Failed to send quote to customer',
                details: result.error
            });
        }
    } catch (error) {
        console.error('Error sending quote to customer:', error);
        res.status(500).json({ error: 'Failed to send quote to customer' });
    }
});

// Send quote confirmation email to customer (admin only)
app.post('/api/bookings/:bookingId/send-quote-confirmation-email', requireAdminAuth, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { customerEmail, customerName, estimatedCost, workDescription } = req.body;

        if (!customerEmail || !customerName || !estimatedCost || !workDescription) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get booking details
        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Import and use EmailService
        const EmailService = require('./email-service');
        const emailService = new EmailService();
        
        // Send quote confirmation email with booking link
        const result = await emailService.sendQuoteConfirmationEmail(
            customerEmail, 
            bookingId, 
            booking.service, 
            estimatedCost,
            workDescription,
            customerName,
            booking.address || '',
            booking.notes || ''
        );

        if (result.success) {
            console.log('📧 Quote confirmation email sent successfully');
            res.json({
                message: 'Quote confirmation email sent successfully',
                messageId: result.messageId
            });
        } else {
            console.error('📧 Failed to send quote confirmation email:', result.error);
            res.status(500).json({
                error: 'Failed to send quote confirmation email',
                details: result.error
            });
        }
    } catch (error) {
        console.error('Error sending quote confirmation email:', error);
        res.status(500).json({ error: 'Failed to send quote confirmation email' });
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

        // Import and use EmailService
        const EmailService = require('./email-service');
        const emailService = new EmailService();
        
        // Send booking confirmation email using MailerSend
        const result = await emailService.sendBookingConfirmationEmail(
            customerEmail, 
            bookingId, 
            booking.service, 
            booking.date, 
            booking.time, 
            customerName,
            booking.address || '',
            booking.notes || ''
        );

        if (result.success) {
            console.log('📧 Booking confirmation email sent successfully via MailerSend');
            res.json({
                message: 'Booking confirmation email sent successfully via MailerSend',
                messageId: result.messageId
            });
        } else {
            console.error('📧 Failed to send booking confirmation email:', result.error);
            res.status(500).json({
                error: 'Failed to send booking confirmation email',
                details: result.error
            });
        }
    } catch (error) {
        console.error('Error sending booking email:', error);
        res.status(500).json({ error: 'Failed to send booking email' });
    }
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Mark invoice as paid (admin only)
app.patch('/api/bookings/:bookingId/mark-paid', requireAdminAuth, async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Get booking details
        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Update the booking status to 'completed'
        const result = await db.collection('bookings').updateOne(
            { booking_id: bookingId },
            { 
                $set: { 
                    status: 'completed',
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                } 
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`✅ Invoice marked as paid for ${bookingId}`);
            res.json({ 
                message: 'Invoice marked as paid successfully',
                status: 'completed'
            });
        } else {
            res.status(500).json({ error: 'Failed to update booking' });
        }
    } catch (error) {
        console.error('Error marking invoice as paid:', error);
        res.status(500).json({ error: 'Failed to mark invoice as paid' });
    }
});

// Customer accepts quote (no auth required)
app.post('/api/bookings/:bookingId/accept-quote', async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        console.log(`📝 Customer accepting quote for booking: ${bookingId}`);
        console.log(`🔍 Request method: ${req.method}`);
        console.log(`🔍 Request URL: ${req.url}`);

        // Get booking details
        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
        if (!booking) {
            console.log(`❌ Booking not found: ${bookingId}`);
            return res.status(404).json({ error: 'Booking not found' });
        }

        console.log(`✅ Found booking: ${bookingId}, current status: ${booking.status}`);

        // Update the booking status to 'quote-accepted'
        const result = await db.collection('bookings').updateOne(
            { booking_id: bookingId },
            { 
                $set: { 
                    status: 'quote-accepted',
                    updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                } 
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`✅ Quote accepted by customer for ${bookingId}`);
            
            // Send quote acceptance email to customer
            try {
                const EmailService = require('./email-service');
                const emailService = new EmailService();
                
                const emailResult = await emailService.sendQuoteAcceptanceEmail(
                    booking.email,
                    booking.booking_id,
                    booking.service,
                    booking.estimated_cost || 'TBD',
                    booking.work_description || 'Tree service as requested',
                    booking.name,
                    booking.address || '',
                    booking.notes || ''
                );
                
                if (emailResult.success) {
                    console.log(`📧 Quote acceptance email sent successfully to ${booking.email}`);
                } else {
                    console.log(`⚠️ Quote acceptance email failed to send: ${emailResult.error}`);
                }
            } catch (emailError) {
                console.error('❌ Error sending quote acceptance email:', emailError);
            }
            
            res.json({ 
                message: 'Quote accepted successfully',
                status: 'quote-accepted'
            });
        } else {
            console.log(`❌ Failed to update booking: ${bookingId}`);
            res.status(500).json({ error: 'Failed to update booking' });
        }
    } catch (error) {
        console.error('❌ Error accepting quote:', error);
        res.status(500).json({ error: 'Failed to accept quote' });
    }
});

// Handle job booking from customer
app.post('/api/bookings/:bookingId/book-job', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { jobDate, jobTime } = req.body;

        if (!jobDate || !jobTime) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get booking details
        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Update booking with job details and change status to 'pending-booking'
        const result = await db.collection('bookings').updateOne(
            { booking_id: bookingId },
            { 
                $set: { 
                    job_date: jobDate,
                    job_time: jobTime,
                    status: 'pending-booking'
                }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`📅 Job booking submitted for ${bookingId}: ${jobDate} at ${jobTime}`);
            res.json({ 
                message: 'Job booking submitted successfully',
                jobDate: jobDate,
                jobTime: jobTime
            });
        } else {
            res.status(500).json({ error: 'Failed to update booking' });
        }
    } catch (error) {
        console.error('Error booking job:', error);
        res.status(500).json({ error: 'Failed to book job' });
    }
});

// Send quote ready email to customer
app.post('/api/bookings/:bookingId/send-quote-ready-email', requireAdminAuth, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { customerEmail, customerName, workDescription, estimatedCost } = req.body;

        if (!customerEmail || !customerName || !workDescription || !estimatedCost) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get booking details
        const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Send quote ready email
        const result = await emailService.sendQuoteReadyEmail(
            customerEmail,
            bookingId,
            booking.service,
            booking.date,
            booking.time,
            customerName,
            booking.address || '',
            booking.notes || '',
            estimatedCost,
            workDescription
        );

        if (result.success) {
            res.json({ 
                message: 'Quote ready email sent successfully',
                messageId: result.messageId
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to send quote ready email',
                details: result.error
            });
        }
    } catch (error) {
        console.error('Error sending quote ready email:', error);
        res.status(500).json({ error: 'Failed to send quote ready email' });
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
        const emailResult = await emailService.sendBookingFinalConfirmationEmail(
            customerEmail, 
            bookingId, 
            booking.service, 
            booking.date, 
            booking.time, 
            customerName,
            booking.address || '',
            booking.notes || ''
        );

        console.log('📧 Final confirmation email sent successfully');
        console.log('📧 Email result:', emailResult);
        res.json({
            message: 'Final booking confirmation email sent successfully',
            emailResult: emailResult
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

        // Customer total spent update - REMOVED

        res.json({ message: 'Booking confirmed successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Send customer message via email
app.post('/api/bookings/send-customer-message', requireAdminAuth, async (req, res) => {
    try {
        // Import and initialize EmailService
        const EmailService = require('./email-service');
        const emailService = new EmailService();
        
        const { bookingId, customerName, customerEmail, subject, message } = req.body;

        if (!bookingId || !customerName || !customerEmail || !subject || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create email content with the requested format
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${subject}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');
                    
                    body { 
                        margin: 0; 
                        padding: 0; 
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                        line-height: 1.6; 
                        color: #2a2a2a; 
                        background-color: #f8f9fa; 
                    }
                    
                    .email-container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background: #ffffff; 
                        border-radius: 12px; 
                        overflow: hidden; 
                        box-shadow: 0 8px 32px rgba(42, 42, 42, 0.08);
                    }
                    
                    .header { 
                        background: linear-gradient(135deg, #2a2a2a 0%, #404040 100%); 
                        color: white; 
                        padding: 40px 30px; 
                        text-align: center; 
                        position: relative;
                    }
                    
                    .header::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 100%;
                        height: 4px;
                        background: #8cc63f;
                    }
                    
                    .logo-section {
                        margin-bottom: 20px;
                    }
                    
                    .logo {
                        width: 60px;
                        height: 60px;
                        background: #8cc63f;
                        border-radius: 50%;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        font-weight: 700;
                        color: white;
                        margin-bottom: 15px;
                    }
                    
                    .company-name {
                        font-size: 28px;
                        font-weight: 700;
                        margin-bottom: 10px;
                        font-family: 'Poppins', sans-serif;
                    }
                    
                    .company-tagline {
                        font-size: 16px;
                        opacity: 0.9;
                        font-weight: 400;
                    }
                    
                    .content { 
                        padding: 40px 30px; 
                        background: #ffffff; 
                    }
                    
                    .greeting {
                        font-size: 20px;
                        font-weight: 600;
                        color: #2a2a2a;
                        margin-bottom: 25px;
                        font-family: 'Poppins', sans-serif;
                    }
                    
                    .message-body {
                        font-size: 16px;
                        line-height: 1.7;
                        color: #4a4a4a;
                        margin-bottom: 30px;
                        white-space: pre-wrap;
                    }
                    
                    .footer { 
                        background: #f8f9fa; 
                        padding: 30px; 
                        text-align: center; 
                        border-top: 1px solid #e5e7eb;
                    }
                    
                    .signature {
                        font-size: 16px;
                        font-weight: 600;
                        color: #2a2a2a;
                        margin-bottom: 10px;
                        font-family: 'Poppins', sans-serif;
                    }
                    
                    .company-info {
                        font-size: 14px;
                        color: #6b7280;
                        line-height: 1.5;
                    }
                    
                    .contact-info {
                        margin-top: 20px;
                        padding-top: 20px;
                        border-top: 1px solid #e5e7eb;
                    }
                    
                    .contact-item {
                        display: inline-block;
                        margin: 0 15px;
                        font-size: 14px;
                        color: #6b7280;
                    }
                    
                    .contact-item i {
                        margin-right: 5px;
                        color: #8cc63f;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo-section">
                            <div class="logo">🌳</div>
                            <div class="company-name">Stellar Tree Management</div>
                            <div class="company-tagline">Professional Tree Care Services</div>
                        </div>
                    </div>
                    
                    <div class="content">
                        <div class="greeting">Dear ${customerName},</div>
                        
                        <div class="message-body">${message}</div>
                    </div>
                    
                    <div class="footer">
                        <div class="signature">Sincerely,</div>
                        <div class="company-info">
                            <strong>Stellar Tree Management Team</strong><br>
                            Professional tree care and maintenance services
                        </div>
                        
                        <div class="contact-info">
                            <div class="contact-item">
                                <i class="fas fa-phone"></i> (403) 555-0123
                            </div>
                            <div class="contact-item">
                                <i class="fas fa-envelope"></i> info@stellartreemanagement.ca
                            </div>
                            <div class="contact-item">
                                <i class="fas fa-globe"></i> stellartreemanagement.ca
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send email using the email service
        const emailResult = await emailService.sendEmail(
            customerEmail,
            subject,
            htmlContent
        );

        if (emailResult.success) {
            console.log('📧 Customer message sent successfully');
            res.json({
                message: 'Customer message sent successfully',
                emailResult: emailResult
            });
        } else {
            console.error('❌ Failed to send customer message:', emailResult.error);
            res.status(500).json({ 
                error: 'Failed to send customer message',
                details: emailResult.error 
            });
        }
    } catch (error) {
        console.error('Error sending customer message:', error);
        res.status(500).json({ error: 'Failed to send customer message' });
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

        // Customer stats - REMOVED

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
            customer_stats: { total_customers: 0, customers_with_bookings: 0 }, // REMOVED
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
            status: { $in: ['pending', 'pending-site-visit', 'quote-ready', 'quote-sent', 'quote-accepted', 'confirmed', 'pending-booking'] }
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

        // Customer management - REMOVED

        const newQuote = {
            quote_id: quote_id,
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
        const { booking_id } = req.query;
        
        let matchStage = {};
        if (booking_id) {
            matchStage = { booking_id: booking_id };
        }
        
        const quotes = await db.collection('quotes').aggregate([
            {
                $match: matchStage
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
        console.log(`🔍 Fetching quotes for booking: ${bookingId}`);
        
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
        
        console.log(`📋 Found ${quotes.length} quotes for booking ${bookingId}`);
        
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
        console.error('❌ Database error fetching quotes:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get quote details by booking ID (for client-facing quote preview)
app.get('/api/bookings/:bookingId/quote', async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        // First try to get an existing quote
        const quotes = await db.collection('quotes').aggregate([
            {
                $match: { booking_id: bookingId }
            },
            {
                $sort: { created_at: -1 }
            }
        ]).toArray();
        
        if (quotes.length > 0) {
            const quote = quotes[0];
            
            // Parse service_items JSON
            let serviceItems = [];
            try {
                serviceItems = JSON.parse(quote.service_items);
            } catch (e) {
                serviceItems = [];
            }
            
            // Calculate totals
            const subtotal = serviceItems.reduce((sum, item) => sum + (item.total || 0), 0);
            const tax = quote.tax_enabled ? subtotal * 0.05 : 0;
            const total = subtotal + tax;
            
            // Map to frontend-expected format
            const quoteData = {
                quote_number: quote.quote_id,
                quote_date: quote.quote_date,
                client_name: quote.client_name,
                client_phone: quote.client_phone,
                client_email: quote.client_email,
                client_address: quote.client_address,
                bill_name: quote.client_name,
                bill_address: quote.client_address,
                services: serviceItems.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total: item.total
                })),
                subtotal: subtotal,
                tax: tax,
                total: total,
                tax_enabled: quote.tax_enabled
            };
            
            res.json(quoteData);
        } else {
            // No quote found, get booking data and create a basic quote structure
            const booking = await db.collection('bookings').findOne({ booking_id: bookingId });
            
            if (!booking) {
                return res.status(404).json({ error: 'Booking not found' });
            }
            
            // Create basic quote structure from booking
            const quoteData = {
                quote_number: 'QT-' + Date.now(),
                quote_date: new Date().toISOString().split('T')[0],
                client_name: booking.name,
                client_phone: booking.phone,
                client_email: booking.email,
                client_address: booking.address,
                bill_name: booking.name,
                bill_address: booking.address,
                services: [
                    {
                        description: booking.service || 'Tree Service',
                        quantity: 1,
                        unit_price: 0,
                        total: 0
                    }
                ],
                subtotal: 0,
                tax: 0,
                total: 0,
                tax_enabled: false
            };
            
            res.json(quoteData);
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Send quote
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
        
        // Import and use EmailService
        const EmailService = require('./email-service');
        const emailService = new EmailService();
        
        // Send email using the comprehensive quote email template with orange theme
        // This ensures both quote sending mechanisms use the exact same email template
        const result = await emailService.sendQuoteEmail(
            quote.client_email,
            quote.quote_id,
            quote.client_name,
            quote.quote_date,
            quote.total_amount,
            serviceItems,
            quote.booking_id,
            quote.serviceItemPhotos
        );
        
        if (result.success) {
            // Update the booking status to 'quote-sent' if we have a booking ID
            if (quote.booking_id) {
                try {
                    await db.collection('bookings').updateOne(
                        { booking_id: quote.booking_id },
                        { 
                            $set: { 
                                status: 'quote-sent',
                                updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                            }
                        }
                    );
                } catch (statusError) {
                    console.warn('Could not update booking status:', statusError);
                    // Don't fail the whole operation if status update fails
                }
            }
            
            res.json({
                message: 'Quote sent successfully via MailerSend and status updated',
                messageId: result.messageId,
                statusUpdated: true
            });
        } else {
            res.status(500).json({
                error: 'Failed to send quote',
                details: result.error
            });
        }
    } catch (error) {
        console.error('Error sending quote:', error);
        res.status(500).json({ error: 'Failed to send quote' });
    }
});

// Service Item Photo Management endpoints

// Upload photos for a specific service item in a quote
app.post('/api/service-item-photos/:quoteId/:itemId', upload.array('photos', 5), async (req, res) => {
    try {
        const { quoteId, itemId } = req.params;
        const { itemIndex } = req.body; // Index of the service item in the quote
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No photos uploaded' });
        }

        console.log(`📸 Processing ${req.files.length} photos for service item ${itemId} in quote ${quoteId}`);

        const imagePaths = [];
        
        for (const file of req.files) {
            // Create a unique ID for the image
            const imageId = new ObjectId();
            
            // Store the image in MongoDB
            await db.collection('images').insertOne({
                _id: imageId,
                quoteId: quoteId,
                itemId: itemId,
                itemIndex: parseInt(itemIndex),
                filename: file.originalname,
                contentType: file.mimetype,
                size: file.size,
                data: new Binary(file.buffer),
                uploadedAt: new Date(),
                type: 'service-item-photo'
            });

            const imagePath = `/uploads/${imageId}`;
            imagePaths.push(imagePath);
            
            console.log(`✅ Stored service item photo: ${file.originalname} -> ${imageId}`);
        }

        // Update the quote with the new photo paths
        const quotesCollection = db.collection('quotes');
        const quote = await quotesCollection.findOne({ quote_id: quoteId });
        
        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        // Initialize serviceItemPhotos if it doesn't exist
        if (!quote.serviceItemPhotos) {
            quote.serviceItemPhotos = {};
        }
        
        // Add photos to the specific service item
        if (!quote.serviceItemPhotos[itemId]) {
            quote.serviceItemPhotos[itemId] = [];
        }
        
        quote.serviceItemPhotos[itemId].push(...imagePaths);

        // Update the quote in the database
        await quotesCollection.updateOne(
            { quote_id: quoteId },
            { $set: { serviceItemPhotos: quote.serviceItemPhotos } }
        );

        console.log(`✅ Updated quote ${quoteId} with ${imagePaths.length} photos for item ${itemId}`);

        res.json({
            success: true,
            message: `${imagePaths.length} photos uploaded successfully`,
            imagePaths: imagePaths
        });

    } catch (error) {
        console.error('❌ Error uploading service item photos:', error);
        res.status(500).json({ error: 'Failed to upload photos' });
    }
});

// Get photos for a specific service item in a quote
app.get('/api/service-item-photos/:quoteId/:itemId', async (req, res) => {
    try {
        const { quoteId, itemId } = req.params;
        
        const quotesCollection = db.collection('quotes');
        const quote = await quotesCollection.findOne({ quote_id: quoteId });
        
        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        const photos = quote.serviceItemPhotos?.[itemId] || [];
        
        res.json({
            success: true,
            photos: photos
        });

    } catch (error) {
        console.error('❌ Error fetching service item photos:', error);
        res.status(500).json({ error: 'Failed to fetch photos' });
    }
});

// Delete a specific photo from a service item
app.delete('/api/service-item-photos/:quoteId/:itemId/:imageId', async (req, res) => {
    try {
        const { quoteId, itemId, imageId } = req.params;
        
        // Remove the image from MongoDB
        try {
            const objectId = new ObjectId(imageId);
            await db.collection('images').deleteOne({ _id: objectId });
            console.log(`✅ Deleted service item photo: ${imageId}`);
        } catch (error) {
            console.error('❌ Error deleting image from MongoDB:', error);
        }

        // Update the quote to remove the photo reference
        const quotesCollection = db.collection('quotes');
        const quote = await quotesCollection.findOne({ quote_id: quoteId });
        
        if (quote && quote.serviceItemPhotos && quote.serviceItemPhotos[itemId]) {
            quote.serviceItemPhotos[itemId] = quote.serviceItemPhotos[itemId].filter(
                path => !path.includes(imageId)
            );

            await quotesCollection.updateOne(
                { quote_id: quoteId },
                { $set: { serviceItemPhotos: quote.serviceItemPhotos } }
            );

            console.log(`✅ Updated quote ${quoteId} to remove photo ${imageId} from item ${itemId}`);
        }

        res.json({
            success: true,
            message: 'Photo deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting service item photo:', error);
        res.status(500).json({ error: 'Failed to delete photo' });
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

        // Customer management - REMOVED

        const newInvoice = {
            invoice_id: invoice_id,
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

        // Customer total spent update - REMOVED

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

// Get invoices by booking ID
app.get('/api/invoices/booking/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        const invoices = await db.collection('invoices').aggregate([
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

// Update invoice
app.patch('/api/invoices/:invoiceId', async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const updateData = req.body;

        // Validate required fields
        if (!updateData.client_name || !updateData.client_phone || !updateData.client_address || !updateData.client_email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Prepare update object
        const updateObject = {
            client_name: updateData.client_name,
            client_phone: updateData.client_phone,
            client_address: updateData.client_address,
            client_email: updateData.client_email,
            invoice_date: updateData.invoice_date,
            service_items: JSON.stringify(updateData.service_items),
            subtotal: updateData.subtotal,
            tax_amount: updateData.tax_amount,
            total_amount: updateData.total_amount,
            tax_enabled: updateData.tax_enabled,
            updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        const result = await db.collection('invoices').updateOne(
            { invoice_id: invoiceId },
            { $set: updateObject }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json({ message: 'Invoice updated successfully' });
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

        // Customer total spent update - REMOVED

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
        
        // Import and use EmailService
        const EmailService = require('./email-service');
        const emailService = new EmailService();
        
        // Send email using MailerSend
        const result = await emailService.sendInvoiceEmailFromInvoice(
            invoice.client_email,
            invoice.invoice_id,
            invoice.client_name,
            invoice.invoice_date,
            invoice.total_amount,
            serviceItems,
            invoice.serviceItemPhotos,
            invoice.booking_id
        );
        
        if (result.success) {
            res.json({
                message: 'Invoice email sent successfully via MailerSend',
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                error: 'Failed to send invoice email',
                details: result.error
            });
        }
    } catch (error) {
        console.error('Error sending invoice email:', error);
        res.status(500).json({ error: 'Failed to send invoice email' });
    }
});

// Customer Management API Endpoints - REMOVED

// Email confirmation function (placeholder) - REMOVED: Now using EmailService

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





// Customer total spent functions - REMOVED

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
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

// Serve test page
app.get('/test-booking-status.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-booking-status.html'));
});

// Serve booking status page for specific booking IDs
app.get('/booking-status/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;
    
    // Check if it's a valid booking ID format (you can customize this validation)
    if (bookingId && bookingId.length > 0 && !bookingId.includes('.')) {
        res.sendFile(path.join(__dirname, 'booking-status.html'));
    } else {
        res.status(404).sendFile(path.join(__dirname, 'index.html'));
    }
});

// Handle legacy booking status URLs (for backward compatibility)
app.get('/:bookingId', (req, res) => {
    const bookingId = req.params.bookingId;
    
    // Check if it's a valid booking ID format and not a file extension
    if (bookingId && bookingId.length > 0 && !bookingId.includes('.') && !bookingId.includes('/')) {
        // Check if this looks like a booking ID (e.g., starts with ST-)
        if (bookingId.startsWith('ST-') || /^[A-Z0-9-]+$/.test(bookingId)) {
            res.sendFile(path.join(__dirname, 'booking-status.html'));
        } else {
            res.sendFile(path.join(__dirname, 'index.html'));
        }
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
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

// 404 handler for API routes (add this after the catch-all route)
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Add a catch-all route for client-side routing (add this at the very end)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
startServer();

module.exports = app;