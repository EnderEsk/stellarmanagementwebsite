const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'booking-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Maximum 5 files per booking
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

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Database setup
const dbPath = path.join(__dirname, 'bookings.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
function initializeDatabase() {
    db.serialize(() => {
        // Create customers table
        db.run(`
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                address TEXT,
                notes TEXT,
                total_bookings INTEGER DEFAULT 0,
                total_spent REAL DEFAULT 0,
                first_booking_date TEXT,
                last_booking_date TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create bookings table
        db.run(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id TEXT UNIQUE NOT NULL,
                customer_id TEXT,
                service TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                address TEXT,
                notes TEXT,
                images TEXT,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
            )
        `);

        // Create blocked_dates table
        db.run(`
            CREATE TABLE IF NOT EXISTS blocked_dates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT UNIQUE NOT NULL,
                reason TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create quotes table
        db.run(`
            CREATE TABLE IF NOT EXISTS quotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quote_id TEXT UNIQUE NOT NULL,
                customer_id TEXT NOT NULL,
                booking_id TEXT NOT NULL,
                client_name TEXT NOT NULL,
                client_phone TEXT NOT NULL,
                client_address TEXT NOT NULL,
                client_email TEXT NOT NULL,
                quote_date TEXT NOT NULL,
                service_items TEXT NOT NULL,
                subtotal REAL NOT NULL,
                tax_amount REAL DEFAULT 0,
                total_amount REAL NOT NULL,
                tax_enabled BOOLEAN DEFAULT 0,
                status TEXT DEFAULT 'draft',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
                FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
            )
        `);

        // Create invoices table
        db.run(`
            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id TEXT UNIQUE NOT NULL,
                customer_id TEXT NOT NULL,
                quote_id TEXT NOT NULL,
                booking_id TEXT NOT NULL,
                client_name TEXT NOT NULL,
                client_phone TEXT NOT NULL,
                client_address TEXT NOT NULL,
                client_email TEXT NOT NULL,
                invoice_date TEXT NOT NULL,
                service_items TEXT NOT NULL,
                subtotal REAL NOT NULL,
                tax_amount REAL DEFAULT 0,
                total_amount REAL NOT NULL,
                tax_enabled BOOLEAN DEFAULT 0,
                status TEXT DEFAULT 'pending',
                payment_status TEXT DEFAULT 'unpaid',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
                FOREIGN KEY (quote_id) REFERENCES quotes(quote_id),
                FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
            )
        `);

        // Create indexes for better performance
        db.run('CREATE INDEX IF NOT EXISTS idx_customer_id ON customers(customer_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_customer_phone ON customers(phone)');
        db.run('CREATE INDEX IF NOT EXISTS idx_customer_email ON customers(email)');
        db.run('CREATE INDEX IF NOT EXISTS idx_booking_customer_id ON bookings(customer_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_date_time ON bookings(date, time)');
        db.run('CREATE INDEX IF NOT EXISTS idx_booking_id ON bookings(booking_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_email ON bookings(email)');
        db.run('CREATE INDEX IF NOT EXISTS idx_blocked_date ON blocked_dates(date)');
        db.run('CREATE INDEX IF NOT EXISTS idx_quote_customer_id ON quotes(customer_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_invoice_customer_id ON invoices(customer_id)');
    });
}

// Initialize database on startup
initializeDatabase();

// API Routes

// Get all bookings
app.get('/api/bookings', (req, res) => {
    const query = `
        SELECT id, booking_id, service, date, time, name, email, phone, address, notes, images, status, created_at
        FROM bookings
        ORDER BY date ASC, time ASC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Get bookings for a specific date
app.get('/api/bookings/date/:date', (req, res) => {
    const { date } = req.params;
    
    const query = `
        SELECT id, booking_id, service, date, time, name, email, phone, address, notes, images, status
        FROM bookings
        WHERE date = ?
        ORDER BY time ASC
    `;
    
    db.all(query, [date], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
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

// Get availability data for a date range
app.get('/api/availability', (req, res) => {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const query = `
        SELECT date, time, status
        FROM bookings
        WHERE date BETWEEN ? AND ?
        AND status IN ('pending', 'confirmed')
        ORDER BY date ASC, time ASC
    `;
    
    db.all(query, [start_date, end_date], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Group by date and time slot with normalized times
        const availability = {};
        rows.forEach(booking => {
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
        const blockedQuery = 'SELECT date, reason FROM blocked_dates WHERE date BETWEEN ? AND ?';
        
        db.all(blockedQuery, [start_date, end_date], (err, blockedRows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Add blocked dates to availability data (excluding unblocked weekends)
            blockedRows.forEach(blocked => {
                if (blocked.reason !== 'unblocked_weekend') {
                    if (!availability[blocked.date]) {
                        availability[blocked.date] = {};
                    }
                    availability[blocked.date]['blocked'] = true;
                }
            });
            
            res.json(availability);
        });
    });
});

// Create new booking with image uploads
app.post('/api/bookings', upload.array('images', 5), (req, res) => {
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

    // Validation
    if (!booking_id || !service || !date || !time || !name || !email || !phone || !address) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for double booking
    const checkQuery = `
        SELECT COUNT(*) as count
        FROM bookings
        WHERE date = ? AND time = ? AND status != 'cancelled'
    `;

    db.get(checkQuery, [date, time], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (row.count > 0) {
            return res.status(409).json({ error: 'This time slot is already booked' });
        }

        // Check if customer exists by phone number
        const customerQuery = 'SELECT customer_id FROM customers WHERE phone = ?';
        
        db.get(customerQuery, [phone], (err, customer) => {
            let customerId = null;
            
            if (customer) {
                customerId = customer.customer_id;
            } else {
                // Create new customer
                customerId = generateUniqueId('CUST');
                const createCustomerQuery = `
                    INSERT INTO customers (customer_id, name, email, phone, address)
                    VALUES (?, ?, ?, ?, ?)
                `;
                
                db.run(createCustomerQuery, [customerId, name, email, phone, address], function(err) {
                    if (err) {
                        console.error('Error creating customer:', err);
                    }
                });
            }

            // Process uploaded images
            const imagePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
            const imagesJson = JSON.stringify(imagePaths);

            // Insert new booking with customer_id and images
            const insertQuery = `
                INSERT INTO bookings (
                    booking_id, customer_id, service, date, time, name, email, phone, address, notes, images, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            `;

            db.run(insertQuery, [booking_id, customerId, service, date, time, name, email, phone, address, notes || '', imagesJson], function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to create booking' });
                }

                // Send confirmation email (placeholder for now)
                sendConfirmationEmail(email, booking_id, service, date, time, name);

                res.status(201).json({
                    message: 'Booking created successfully',
                    bookingId: booking_id,
                    customerId: customerId,
                    id: this.lastID
                });
            });
        });
    });
});

// Update booking status
app.patch('/api/bookings/:bookingId/status', (req, res) => {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    // First, get the customer_id for this booking
    const getCustomerQuery = 'SELECT customer_id FROM bookings WHERE booking_id = ?';
    
    db.get(getCustomerQuery, [bookingId], (err, booking) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const updateQuery = `
            UPDATE bookings
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE booking_id = ?
        `;

        db.run(updateQuery, [status, bookingId], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Booking not found' });
            }

            // If booking is completed, update customer total spent
            if (status === 'completed' && booking.customer_id) {
                updateCustomerTotalSpent(booking.customer_id, (err, totalSpent) => {
                    if (err) {
                        console.error('Error updating customer total spent:', err);
                        // Don't fail the request, just log the error
                    }
                });
            }

            res.json({ message: 'Booking status updated successfully' });
        });
    });
});

// Get booking by ID
app.get('/api/bookings/:bookingId', (req, res) => {
    const { bookingId } = req.params;

    const query = `
        SELECT id, booking_id, service, date, time, name, email, phone, address, notes, status, created_at
        FROM bookings
        WHERE booking_id = ?
    `;

    db.get(query, [bookingId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json(row);
    });
});

// Delete booking (admin only)
app.delete('/api/bookings/:bookingId', (req, res) => {
    const { bookingId } = req.params;

    const query = 'DELETE FROM bookings WHERE booking_id = ?';

    db.run(query, [bookingId], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({ message: 'Booking deleted successfully' });
    });
});

// Get booking statistics
app.get('/api/bookings/stats/overview', (req, res) => {
    const query = `
        SELECT 
            COUNT(*) as total_bookings,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
            COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
            COUNT(CASE WHEN date >= date('now') THEN 1 END) as upcoming_bookings
        FROM bookings
    `;

    db.get(query, [], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(row);
    });
});

// Get all blocked dates
app.get('/api/blocked-dates', (req, res) => {
    const query = 'SELECT date, reason FROM blocked_dates ORDER BY date ASC';
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        const blockedDates = rows.map(row => ({
            date: row.date,
            reason: row.reason
        }));
        res.json(blockedDates);
    });
});

// Block a date
app.post('/api/blocked-dates', (req, res) => {
    const { date, reason, unblockWeekend } = req.body;
    
    if (!date) {
        return res.status(400).json({ error: 'Date is required' });
    }
    
    if (unblockWeekend) {
        // For weekend unblocking, we add a special reason to indicate it's unblocked
        const query = 'INSERT OR REPLACE INTO blocked_dates (date, reason) VALUES (?, ?)';
        const unblockReason = 'unblocked_weekend';
        
        db.run(query, [date, unblockReason], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({ message: 'Weekend made available for booking', id: this.lastID });
        });
    } else {
        // Regular date blocking
        const query = 'INSERT INTO blocked_dates (date, reason) VALUES (?, ?)';
        
        db.run(query, [date, reason || null], function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ error: 'Date is already blocked' });
                }
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({ message: 'Date blocked successfully', id: this.lastID });
        });
    }
});

// Unblock a date
app.delete('/api/blocked-dates/:date', (req, res) => {
    const { date } = req.params;
    
    const query = 'DELETE FROM blocked_dates WHERE date = ?';
    
    db.run(query, [date], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Blocked date not found' });
        }
        
        res.json({ message: 'Date unblocked successfully' });
    });
});

// Move booking to a new date
app.patch('/api/bookings/:bookingId/move', (req, res) => {
    const { bookingId } = req.params;
    const { newDate } = req.body;
    
    if (!newDate) {
        return res.status(400).json({ error: 'New date is required' });
    }
    
    // Check if the new date is available (any time slot)
    const checkQuery = `
        SELECT COUNT(*) as count
        FROM bookings
        WHERE date = ? AND status IN ('pending', 'confirmed')
    `;
    
    db.get(checkQuery, [newDate], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Check if all time slots are taken (3 slots per day)
        if (row.count >= 3) {
            return res.status(409).json({ error: `All time slots are already booked on ${newDate}` });
        }
        
        // Check if the new date is blocked
        const blockedQuery = 'SELECT COUNT(*) as count FROM blocked_dates WHERE date = ?';
        
        db.get(blockedQuery, [newDate], (err, blockedRow) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (blockedRow.count > 0) {
                return res.status(409).json({ error: 'Target date is blocked' });
            }
            
            // Update the booking date
            const updateQuery = `
                UPDATE bookings
                SET date = ?, updated_at = CURRENT_TIMESTAMP
                WHERE booking_id = ?
            `;
            
            db.run(updateQuery, [newDate, bookingId], function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Booking not found' });
                }
                
                res.json({ message: 'Booking moved successfully' });
            });
        });
    });
});

// Get bookings by date range
app.get('/api/bookings/range', (req, res) => {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
        return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const query = `
        SELECT id, booking_id, service, date, time, name, email, phone, address, notes, status
        FROM bookings
        WHERE date BETWEEN ? AND ?
        ORDER BY date ASC, time ASC
    `;

    db.all(query, [start_date, end_date], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Update booking notes
app.patch('/api/bookings/:bookingId/notes', (req, res) => {
    const { bookingId } = req.params;
    const { notes } = req.body;

    if (notes === undefined) {
        return res.status(400).json({ error: 'Notes field is required' });
    }

    const updateQuery = `
        UPDATE bookings
        SET notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE booking_id = ?
    `;

    db.run(updateQuery, [notes, bookingId], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        res.json({ message: 'Notes updated successfully' });
    });
});

// Generate unique ID
function generateUniqueId(prefix) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
}

// Quotes API endpoints

// Create a new quote
app.post('/api/quotes', (req, res) => {
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

    // Get customer_id from phone number
    const customerQuery = 'SELECT customer_id FROM customers WHERE phone = ?';
    
    db.get(customerQuery, [client_phone], (err, customer) => {
        let customerId = null;
        
        if (customer) {
            customerId = customer.customer_id;
        } else {
            // Create new customer if not found
            customerId = generateUniqueId('CUST');
            const createCustomerQuery = `
                INSERT INTO customers (customer_id, name, email, phone, address)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            db.run(createCustomerQuery, [customerId, client_name, client_email, client_phone, client_address], function(err) {
                if (err) {
                    console.error('Error creating customer:', err);
                }
            });
        }

        const insertQuery = `
            INSERT INTO quotes (
                quote_id, customer_id, booking_id, client_name, client_phone, client_address, client_email,
                quote_date, service_items, subtotal, tax_amount, total_amount, tax_enabled
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(insertQuery, [
            quote_id, customerId, booking_id, client_name, client_phone, client_address, client_email,
            quote_date, serviceItemsJson, subtotal, tax_amount, total_amount, tax_enabled ? 1 : 0
        ], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({
                message: 'Quote created successfully',
                quote_id: quote_id,
                id: this.lastID
            });
        });
    });
});

// Get all quotes
app.get('/api/quotes', (req, res) => {
    const query = `
        SELECT q.*, b.service as booking_service, b.date as booking_date, b.time as booking_time
        FROM quotes q
        LEFT JOIN bookings b ON q.booking_id = b.booking_id
        ORDER BY q.created_at DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Parse service_items JSON for each quote
        rows.forEach(row => {
            try {
                row.service_items = JSON.parse(row.service_items);
            } catch (e) {
                row.service_items = [];
            }
        });
        
        res.json(rows);
    });
});

// Get quote by ID
app.get('/api/quotes/:quoteId', (req, res) => {
    const { quoteId } = req.params;
    
    const query = `
        SELECT q.*, b.service as booking_service, b.date as booking_date, b.time as booking_time
        FROM quotes q
        LEFT JOIN bookings b ON q.booking_id = b.booking_id
        WHERE q.quote_id = ?
    `;
    
    db.get(query, [quoteId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Quote not found' });
        }
        
        // Parse service_items JSON
        try {
            row.service_items = JSON.parse(row.service_items);
        } catch (e) {
            row.service_items = [];
        }
        
        res.json(row);
    });
});

// Update an existing quote
app.put('/api/quotes/:quoteId', (req, res) => {
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

    const updateQuery = `
        UPDATE quotes SET
            booking_id = ?,
            client_name = ?,
            client_phone = ?,
            client_address = ?,
            client_email = ?,
            quote_date = ?,
            service_items = ?,
            subtotal = ?,
            tax_amount = ?,
            total_amount = ?,
            tax_enabled = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE quote_id = ?
    `;

    db.run(updateQuery, [
        booking_id, client_name, client_phone, client_address, client_email,
        quote_date, serviceItemsJson, subtotal, tax_amount, total_amount, tax_enabled ? 1 : 0, quoteId
    ], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        res.json({
            message: 'Quote updated successfully',
            quote_id: quoteId
        });
    });
});

// Get quote by booking ID
app.get('/api/quotes/booking/:bookingId', (req, res) => {
    const { bookingId } = req.params;
    
    const query = `
        SELECT q.*, b.service as booking_service, b.date as booking_date, b.time as booking_time
        FROM quotes q
        LEFT JOIN bookings b ON q.booking_id = b.booking_id
        WHERE q.booking_id = ?
        ORDER BY q.created_at DESC
    `;
    
    db.all(query, [bookingId], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Parse service_items JSON for each quote
        rows.forEach(row => {
            try {
                row.service_items = JSON.parse(row.service_items);
            } catch (e) {
                row.service_items = [];
            }
        });
        
        res.json(rows);
    });
});

// Invoices API endpoints

// Create invoice from quote
app.post('/api/invoices', (req, res) => {
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

    // Get customer_id from phone number
    const customerQuery = 'SELECT customer_id FROM customers WHERE phone = ?';
    
    db.get(customerQuery, [client_phone], (err, customer) => {
        let customerId = null;
        
        if (customer) {
            customerId = customer.customer_id;
        } else {
            // Create new customer if not found
            customerId = generateUniqueId('CUST');
            const createCustomerQuery = `
                INSERT INTO customers (customer_id, name, email, phone, address)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            db.run(createCustomerQuery, [customerId, client_name, client_email, client_phone, client_address], function(err) {
                if (err) {
                    console.error('Error creating customer:', err);
                }
            });
        }

        const insertQuery = `
            INSERT INTO invoices (
                invoice_id, customer_id, quote_id, booking_id, client_name, client_phone, client_address, client_email,
                invoice_date, service_items, subtotal, tax_amount, total_amount, tax_enabled
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(insertQuery, [
            invoice_id, customerId, quote_id, booking_id, client_name, client_phone, client_address, client_email,
            invoice_date, serviceItemsJson, subtotal, tax_amount, total_amount, tax_enabled ? 1 : 0
        ], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Update customer total spent when invoice is created
            if (customerId) {
                updateCustomerTotalSpent(customerId, (err, totalSpent) => {
                    if (err) {
                        console.error('Error updating customer total spent:', err);
                        // Don't fail the request, just log the error
                    }
                });
            }

            res.json({
                message: 'Invoice created successfully',
                invoice_id: invoice_id,
                id: this.lastID
            });
        });
    });
});

// Get all invoices
app.get('/api/invoices', (req, res) => {
    const query = `
        SELECT i.*, b.service as booking_service, b.date as booking_date, b.time as booking_time,
               q.quote_id as original_quote_id
        FROM invoices i
        LEFT JOIN bookings b ON i.booking_id = b.booking_id
        LEFT JOIN quotes q ON i.quote_id = q.quote_id
        ORDER BY i.created_at DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Parse service_items JSON for each invoice
        rows.forEach(row => {
            try {
                row.service_items = JSON.parse(row.service_items);
            } catch (e) {
                row.service_items = [];
            }
        });
        
        res.json(rows);
    });
});

// Get invoice by ID
app.get('/api/invoices/:invoiceId', (req, res) => {
    const { invoiceId } = req.params;
    
    const query = `
        SELECT i.*, b.service as booking_service, b.date as booking_date, b.time as booking_time,
               q.quote_id as original_quote_id
        FROM invoices i
        LEFT JOIN bookings b ON i.booking_id = b.booking_id
        LEFT JOIN quotes q ON i.quote_id = q.quote_id
        WHERE i.invoice_id = ?
    `;
    
    db.get(query, [invoiceId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        
        // Parse service_items JSON
        try {
            row.service_items = JSON.parse(row.service_items);
        } catch (e) {
            row.service_items = [];
        }
        
        res.json(row);
    });
});

// Update invoice payment status
app.patch('/api/invoices/:invoiceId/payment', (req, res) => {
    const { invoiceId } = req.params;
    const { payment_status } = req.body;

    if (!payment_status || !['paid', 'unpaid', 'partial'].includes(payment_status)) {
        return res.status(400).json({ error: 'Invalid payment status' });
    }

    // First, get the customer_id for this invoice
    const getCustomerQuery = 'SELECT customer_id FROM invoices WHERE invoice_id = ?';
    
    db.get(getCustomerQuery, [invoiceId], (err, invoice) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const updateQuery = `
            UPDATE invoices
            SET payment_status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE invoice_id = ?
        `;

        db.run(updateQuery, [payment_status, invoiceId], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Invoice not found' });
            }

            // If invoice is paid, update customer total spent
            if (payment_status === 'paid' && invoice.customer_id) {
                updateCustomerTotalSpent(invoice.customer_id, (err, totalSpent) => {
                    if (err) {
                        console.error('Error updating customer total spent:', err);
                        // Don't fail the request, just log the error
                    }
                });
            }

            res.json({ message: 'Payment status updated successfully' });
        });
    });
});

// Customer Management API Endpoints

// Get all customers with their statistics
app.get('/api/customers', (req, res) => {
    const query = `
        SELECT 
            c.id,
            c.customer_id,
            c.name,
            c.email,
            c.phone,
            c.address,
            c.notes,
            c.total_bookings,
            c.total_spent,
            c.first_booking_date,
            c.last_booking_date,
            c.created_at,
            c.updated_at,
            COUNT(DISTINCT b.booking_id) as total_bookings_calc,
            COUNT(DISTINCT q.quote_id) as total_quotes,
            COUNT(DISTINCT i.invoice_id) as total_invoices,
            SUM(CASE WHEN i.payment_status = 'paid' THEN i.total_amount ELSE 0 END) as total_paid,
            SUM(CASE WHEN i.payment_status = 'unpaid' THEN i.total_amount ELSE 0 END) as total_unpaid,
            MIN(b.date) as first_booking_date_calc,
            MAX(b.date) as last_booking_date_calc
        FROM customers c
        LEFT JOIN bookings b ON c.customer_id = b.customer_id
        LEFT JOIN quotes q ON c.customer_id = q.customer_id
        LEFT JOIN invoices i ON c.customer_id = i.customer_id
        GROUP BY c.customer_id
        ORDER BY c.name ASC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Get customer by ID with detailed information
app.get('/api/customers/:customerId', (req, res) => {
    const { customerId } = req.params;
    
    // Get customer details
    const customerQuery = `
        SELECT * FROM customers WHERE customer_id = ?
    `;
    
    db.get(customerQuery, [customerId], (err, customer) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        // Get customer's bookings
        const bookingsQuery = `
            SELECT * FROM bookings 
            WHERE customer_id = ? 
            ORDER BY date DESC, time DESC
        `;
        
        db.all(bookingsQuery, [customerId], (err, bookings) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            // Get customer's quotes
            const quotesQuery = `
                SELECT * FROM quotes 
                WHERE customer_id = ? 
                ORDER BY created_at DESC
            `;
            
            db.all(quotesQuery, [customerId], (err, quotes) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                // Get customer's invoices
                const invoicesQuery = `
                    SELECT * FROM invoices 
                    WHERE customer_id = ? 
                    ORDER BY created_at DESC
                `;
                
                db.all(invoicesQuery, [customerId], (err, invoices) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Database error' });
                    }
                    
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
                        totalBreakdown: {
                            allInvoices,
                            totalFromPaidInvoices,
                            completedBookingsWithoutInvoices: completedBookingsWithoutInvoices.length,
                            estimatedTotal,
                            calculatedTotal,
                            storedTotal: customer.total_spent
                        }
                    });
                });
            });
        });
    });
});

// Create or update customer (based on phone number)
app.post('/api/customers', (req, res) => {
    const { name, email, phone, address, notes } = req.body;
    
    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Name, email, and phone are required' });
    }
    
    // Check if customer already exists by phone number
    const checkQuery = 'SELECT * FROM customers WHERE phone = ?';
    
    db.get(checkQuery, [phone], (err, existingCustomer) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (existingCustomer) {
            // Update existing customer
            const updateQuery = `
                UPDATE customers 
                SET name = ?, email = ?, address = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE phone = ?
            `;
            
            db.run(updateQuery, [name, email, address || '', notes || '', phone], function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                res.json({
                    message: 'Customer updated successfully',
                    customer: { ...existingCustomer, name, email, address, notes }
                });
            });
        } else {
            // Create new customer
            const customerId = generateUniqueId('CUST');
            const insertQuery = `
                INSERT INTO customers (customer_id, name, email, phone, address, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            db.run(insertQuery, [customerId, name, email, phone, address || '', notes || ''], function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
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
            });
        }
    });
});

// Update customer
app.put('/api/customers/:customerId', (req, res) => {
    const { customerId } = req.params;
    const { name, email, phone, address, notes } = req.body;
    
    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Name, email, and phone are required' });
    }
    
    const updateQuery = `
        UPDATE customers 
        SET name = ?, email = ?, phone = ?, address = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = ?
    `;
    
    db.run(updateQuery, [name, email, phone, address || '', notes || '', customerId], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        res.json({ message: 'Customer updated successfully' });
    });
});

// Delete customer
app.delete('/api/customers/:customerId', (req, res) => {
    const { customerId } = req.params;
    const { force } = req.query; // Check for force parameter
    
    // Check if customer has any bookings, quotes, or invoices
    const checkQuery = `
        SELECT 
            (SELECT COUNT(*) FROM bookings WHERE customer_id = ?) as booking_count,
            (SELECT COUNT(*) FROM quotes WHERE customer_id = ?) as quote_count,
            (SELECT COUNT(*) FROM invoices WHERE customer_id = ?) as invoice_count
    `;
    
    db.get(checkQuery, [customerId, customerId, customerId], (err, counts) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
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
            const deleteInvoicesQuery = 'DELETE FROM invoices WHERE customer_id = ?';
            const deleteQuotesQuery = 'DELETE FROM quotes WHERE customer_id = ?';
            const deleteBookingsQuery = 'DELETE FROM bookings WHERE customer_id = ?';
            
            db.serialize(() => {
                db.run(deleteInvoicesQuery, [customerId], function(err) {
                    if (err) {
                        console.error('Error deleting invoices:', err);
                        return res.status(500).json({ error: 'Error deleting invoices' });
                    }
                    
                    db.run(deleteQuotesQuery, [customerId], function(err) {
                        if (err) {
                            console.error('Error deleting quotes:', err);
                            return res.status(500).json({ error: 'Error deleting quotes' });
                        }
                        
                        db.run(deleteBookingsQuery, [customerId], function(err) {
                            if (err) {
                                console.error('Error deleting bookings:', err);
                                return res.status(500).json({ error: 'Error deleting bookings' });
                            }
                            
                            // Finally delete the customer
                            const deleteCustomerQuery = 'DELETE FROM customers WHERE customer_id = ?';
                            db.run(deleteCustomerQuery, [customerId], function(err) {
                                if (err) {
                                    console.error('Database error:', err);
                                    return res.status(500).json({ error: 'Database error' });
                                }
                                
                                if (this.changes === 0) {
                                    return res.status(404).json({ error: 'Customer not found' });
                                }
                                
                                res.json({ 
                                    message: 'Customer and all associated data deleted successfully',
                                    deletedCounts: counts
                                });
                            });
                        });
                    });
                });
            });
        } else {
            // Normal delete (no associated data)
            const deleteQuery = 'DELETE FROM customers WHERE customer_id = ?';
            
            db.run(deleteQuery, [customerId], function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Customer not found' });
                }
                
                res.json({ message: 'Customer deleted successfully' });
            });
        }
    });
});

// Search customers
app.get('/api/customers/search/:query', (req, res) => {
    const { query } = req.params;
    const searchTerm = `%${query}%`;
    
    const searchQuery = `
        SELECT 
            c.*,
            COUNT(DISTINCT b.booking_id) as total_bookings,
            COUNT(DISTINCT q.quote_id) as total_quotes,
            COUNT(DISTINCT i.invoice_id) as total_invoices,
            SUM(CASE WHEN i.payment_status = 'paid' THEN i.total_amount ELSE 0 END) as total_paid,
            SUM(CASE WHEN i.payment_status = 'unpaid' THEN i.total_amount ELSE 0 END) as total_unpaid
        FROM customers c
        LEFT JOIN bookings b ON c.customer_id = b.customer_id
        LEFT JOIN quotes q ON c.customer_id = q.customer_id
        LEFT JOIN invoices i ON c.customer_id = i.customer_id
        WHERE c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.address LIKE ?
        GROUP BY c.customer_id
        ORDER BY c.name ASC
    `;
    
    db.all(searchQuery, [searchTerm, searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Link existing bookings to customers (migration function)
app.post('/api/customers/migrate', (req, res) => {
    const query = `
        SELECT DISTINCT phone, name, email, address
        FROM bookings 
        WHERE phone IS NOT NULL AND phone != ''
        ORDER BY phone
    `;
    
    db.all(query, [], (err, bookings) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        let processed = 0;
        let errors = 0;
        
        bookings.forEach(booking => {
            // Check if customer already exists
            const checkQuery = 'SELECT customer_id FROM customers WHERE phone = ?';
            
            db.get(checkQuery, [booking.phone], (err, existing) => {
                if (err) {
                    console.error('Error checking customer:', err);
                    errors++;
                    return;
                }
                
                if (!existing) {
                    // Create new customer
                    const customerId = generateUniqueId('CUST');
                    const insertQuery = `
                        INSERT INTO customers (customer_id, name, email, phone, address)
                        VALUES (?, ?, ?, ?, ?)
                    `;
                    
                    db.run(insertQuery, [customerId, booking.name, booking.email, booking.phone, booking.address || ''], function(err) {
                        if (err) {
                            console.error('Error creating customer:', err);
                            errors++;
                        } else {
                            // Update bookings with customer_id
                            const updateBookingsQuery = `
                                UPDATE bookings 
                                SET customer_id = ? 
                                WHERE phone = ?
                            `;
                            
                            db.run(updateBookingsQuery, [customerId, booking.phone], function(err) {
                                if (err) {
                                    console.error('Error updating bookings:', err);
                                    errors++;
                                } else {
                                    processed++;
                                }
                            });
                        }
                    });
                } else {
                    // Update existing bookings with customer_id
                    const updateBookingsQuery = `
                        UPDATE bookings 
                        SET customer_id = ? 
                        WHERE phone = ?
                    `;
                    
                    db.run(updateBookingsQuery, [existing.customer_id, booking.phone], function(err) {
                        if (err) {
                            console.error('Error updating bookings:', err);
                            errors++;
                        } else {
                            processed++;
                        }
                    });
                }
            });
        });
        
        // Wait a bit for all operations to complete
        setTimeout(() => {
            res.json({ 
                message: 'Migration completed', 
                processed, 
                errors 
            });
        }, 2000);
    });
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

// Function to update customer total spent
function updateCustomerTotalSpent(customerId, callback) {
    // Calculate total from completed bookings
    const bookingsQuery = `
        SELECT COUNT(*) as total_bookings,
               COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings
        FROM bookings 
        WHERE customer_id = ?
    `;
    
    db.get(bookingsQuery, [customerId], (err, bookingStats) => {
        if (err) {
            console.error('Error getting booking stats:', err);
            return callback(err);
        }
        
        // Calculate total from all invoices (both paid and unpaid)
        const invoicesQuery = `
            SELECT COALESCE(SUM(total_amount), 0) as total_paid
            FROM invoices 
            WHERE customer_id = ?
        `;
        
        db.get(invoicesQuery, [customerId], (err, invoiceStats) => {
            if (err) {
                console.error('Error getting invoice stats:', err);
                return callback(err);
            }
            
            // Calculate total from quotes that have been converted to invoices
            const quotesQuery = `
                SELECT COALESCE(SUM(q.total_amount), 0) as total_quotes
                FROM quotes q
                LEFT JOIN invoices i ON q.quote_id = i.quote_id
                WHERE q.customer_id = ? AND i.invoice_id IS NULL
            `;
            
            db.get(quotesQuery, [customerId], (err, quoteStats) => {
                if (err) {
                    console.error('Error getting quote stats:', err);
                    return callback(err);
                }
                
                // Use actual paid invoices as the primary source of truth
                const invoiceTotal = invoiceStats.total_paid || 0;
                const quoteTotal = quoteStats.total_quotes || 0;
                
                // Check if there are completed bookings that don't have corresponding invoices
                const completedBookingsWithoutInvoicesQuery = `
                    SELECT COUNT(*) as count
                    FROM bookings b
                    LEFT JOIN invoices i ON b.booking_id = i.booking_id
                    WHERE b.customer_id = ? 
                    AND b.status = 'completed' 
                    AND i.invoice_id IS NULL
                `;
                
                db.get(completedBookingsWithoutInvoicesQuery, [customerId], (err, completedWithoutInvoices) => {
                    if (err) {
                        console.error('Error getting completed bookings without invoices:', err);
                        return callback(err);
                    }
                    
                    // Only add default cost for completed bookings that don't have invoices
                    const defaultServiceCost = 200.00;
                    const bookingTotal = (completedWithoutInvoices.count || 0) * defaultServiceCost;
                    
                    // Total spent should primarily come from invoices
                    // Only add estimated cost for completed bookings that don't have invoices
                    const totalSpent = invoiceTotal + bookingTotal;
                    
                    // Debug logging
                    console.log(`Customer ${customerId} calculation breakdown:`);
                    console.log(`- Invoice total: $${invoiceTotal.toFixed(2)}`);
                    console.log(`- Completed bookings without invoices: ${completedWithoutInvoices.count || 0}`);
                    console.log(`- Booking total (estimated): $${bookingTotal.toFixed(2)}`);
                    console.log(`- Final total: $${totalSpent.toFixed(2)}`);
                    
                    // Update customer record
                    const updateQuery = `
                        UPDATE customers 
                        SET total_spent = ?, 
                            total_bookings = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE customer_id = ?
                    `;
                    
                    db.run(updateQuery, [totalSpent, bookingStats.total_bookings || 0, customerId], function(err) {
                        if (err) {
                            console.error('Error updating customer total spent:', err);
                            return callback(err);
                        }
                        
                        console.log(`Updated customer ${customerId} total_spent to $${totalSpent.toFixed(2)}`);
                        callback(null, totalSpent);
                    });
                });
            });
        });
    });
}

// Recalculate all customer total spent (admin utility)
app.post('/api/customers/recalculate-totals', (req, res) => {
    const query = 'SELECT customer_id FROM customers';
    
    db.all(query, [], (err, customers) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        let completed = 0;
        let errors = 0;
        
        customers.forEach(customer => {
            updateCustomerTotalSpent(customer.customer_id, (err, totalSpent) => {
                if (err) {
                    console.error(`Error updating customer ${customer.customer_id}:`, err);
                    errors++;
                } else {
                    completed++;
                }
                
                // When all customers are processed
                if (completed + errors === customers.length) {
                    res.json({ 
                        message: `Recalculation completed. Updated ${completed} customers, ${errors} errors.` 
                    });
                }
            });
        });
        
        if (customers.length === 0) {
            res.json({ message: 'No customers found to update.' });
        }
    });
});

// Recalculate specific customer total spent
app.post('/api/customers/:customerId/recalculate-total', (req, res) => {
    const { customerId } = req.params;
    
    updateCustomerTotalSpent(customerId, (err, totalSpent) => {
        if (err) {
            console.error(`Error updating customer ${customerId}:`, err);
            return res.status(500).json({ error: 'Failed to recalculate customer total' });
        }
        
        res.json({ 
            message: `Customer total recalculated successfully. New total: $${totalSpent.toFixed(2)}`,
            totalSpent: totalSpent
        });
    });
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
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Booking server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}/booking/ to access the booking system`);
    console.log(`Visit http://localhost:${PORT}/admin.html to access the admin panel`);
});

module.exports = app; 