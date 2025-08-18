// Script to migrate existing bookings from old time values to new time values (SQLite version)
// This script updates the database to change:
// 8:00 AM / 8am / 8:00 -> 5:30 PM
// 1:00 PM / 1pm / 13:00 -> 6:30 PM  
// 4:00 PM / 4pm / 16:00 -> 7:30 PM

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'bookings.db');

// Time mapping for migration - handle both full and abbreviated formats
const TIME_MAPPING = {
    // Full formats
    '8:00 AM': '5:30 PM',
    '1:00 PM': '6:30 PM',
    '4:00 PM': '7:30 PM',
    // Abbreviated formats
    '8am': '5:30 PM',
    '1pm': '6:30 PM',
    '4pm': '7:30 PM',
    // 24-hour format variations
    '8:00': '5:30 PM',
    '13:00': '6:30 PM',
    '16:00': '7:30 PM',
    '08:00': '5:30 PM',
    '13:00': '6:30 PM',
    '16:00': '7:30 PM'
};

async function migrateBookingTimesSQLite() {
    let db;
    
    try {
        console.log('🔌 Connecting to SQLite database...');
        
        // Open database
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err.message);
                throw err;
            }
            console.log('✅ Connected to SQLite database');
        });
        
        // Check if bookings table exists
        const tableExists = await new Promise((resolve, reject) => {
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='bookings'", (err, row) => {
                if (err) reject(err);
                resolve(!!row);
            });
        });
        
        if (!tableExists) {
            console.log('❌ Bookings table not found. Creating it...');
            await new Promise((resolve, reject) => {
                db.run(`
                    CREATE TABLE IF NOT EXISTS bookings (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        booking_id TEXT UNIQUE,
                        service TEXT,
                        date TEXT,
                        time TEXT,
                        name TEXT,
                        email TEXT,
                        phone TEXT,
                        address TEXT,
                        notes TEXT,
                        status TEXT DEFAULT 'pending',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) reject(err);
                    resolve();
                });
            });
            console.log('✅ Bookings table created');
        }
        
        // Find all bookings with old time values
        const oldTimeBookings = await new Promise((resolve, reject) => {
            const oldTimes = Object.keys(TIME_MAPPING);
            const placeholders = oldTimes.map(() => '?').join(',');
            const query = `SELECT * FROM bookings WHERE time IN (${placeholders})`;
            
            db.all(query, oldTimes, (err, rows) => {
                if (err) reject(err);
                resolve(rows || []);
            });
        });
        
        console.log(`📋 Found ${oldTimeBookings.length} bookings with old time values`);
        
        if (oldTimeBookings.length === 0) {
            console.log('✅ No bookings need migration. All times are already updated.');
            return;
        }
        
        // Display bookings that will be migrated
        console.log('\n📝 Bookings to be migrated:');
        oldTimeBookings.forEach(booking => {
            console.log(`  - ID: ${booking.id}, Date: ${booking.date}, Old Time: ${booking.time} -> New Time: ${TIME_MAPPING[booking.time]}`);
        });
        
        // Perform the migration
        console.log('\n🔄 Starting migration...');
        
        let updatedCount = 0;
        for (const booking of oldTimeBookings) {
            const newTime = TIME_MAPPING[booking.time];
            
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE bookings SET time = ? WHERE id = ?',
                    [newTime, booking.id],
                    function(err) {
                        if (err) {
                            console.error(`❌ Failed to update booking ${booking.id}:`, err.message);
                            reject(err);
                        } else {
                            if (this.changes > 0) {
                                console.log(`✅ Updated booking ${booking.id}: ${booking.time} -> ${newTime}`);
                                updatedCount++;
                            } else {
                                console.log(`⚠️  No changes made to booking ${booking.id}`);
                            }
                            resolve();
                        }
                    }
                );
            });
        }
        
        // Verify the migration
        console.log('\n🔍 Verifying migration...');
        const remainingOldBookings = await new Promise((resolve, reject) => {
            const oldTimes = Object.keys(TIME_MAPPING);
            const placeholders = oldTimes.map(() => '?').join(',');
            const query = `SELECT COUNT(*) as count FROM bookings WHERE time IN (${placeholders})`;
            
            db.get(query, oldTimes, (err, row) => {
                if (err) reject(err);
                resolve(row ? row.count : 0);
            });
        });
        
        if (remainingOldBookings === 0) {
            console.log('✅ Migration successful! All old time values have been updated.');
        } else {
            console.log(`❌ Migration incomplete. ${remainingOldBookings} bookings still have old time values.`);
        }
        
        // Show summary of new time distribution
        const newTimeBookings = await new Promise((resolve, reject) => {
            const newTimes = Object.values(TIME_MAPPING);
            const placeholders = newTimes.map(() => '?').join(',');
            const query = `SELECT time, COUNT(*) as count FROM bookings WHERE time IN (${placeholders}) GROUP BY time`;
            
            db.all(query, newTimes, (err, rows) => {
                if (err) reject(err);
                resolve(rows || []);
            });
        });
        
        console.log('\n📊 New time distribution:');
        newTimeBookings.forEach(row => {
            console.log(`  - ${row.time}: ${row.count} bookings`);
        });
        
        console.log(`\n🎯 Total bookings updated: ${updatedCount}`);
        
    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    } finally {
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                } else {
                    console.log('🔌 Database connection closed');
                }
            });
        }
    }
}

// Run the migration if this script is executed directly
if (require.main === module) {
    migrateBookingTimesSQLite()
        .then(() => {
            console.log('\n🎉 Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateBookingTimesSQLite };
