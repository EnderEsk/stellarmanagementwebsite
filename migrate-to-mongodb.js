const sqlite3 = require('sqlite3').verbose();
const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config();

const sqliteDb = new sqlite3.Database(path.join(__dirname, 'bookings.db'));
const mongoClient = new MongoClient(process.env.MONGODB_URI);

async function migrateData() {
    try {
        // Connect to MongoDB
        await mongoClient.connect();
        const mongoDb = mongoClient.db('stellartmanagement');
        
        console.log('🚀 Starting migration from SQLite to MongoDB...');
        
        // Migrate customers
        await migrateCustomers(mongoDb);
        
        // Migrate bookings
        await migrateBookings(mongoDb);
        
        // Migrate blocked dates
        await migrateBlockedDates(mongoDb);
        
        // Migrate quotes
        await migrateQuotes(mongoDb);
        
        // Migrate invoices
        await migrateInvoices(mongoDb);
        
        console.log('✅ Migration completed successfully!');
        console.log('🎉 Your data is now in MongoDB Atlas!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoClient.close();
        sqliteDb.close();
    }
}

function migrateCustomers(mongoDb) {
    return new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM customers', [], async (err, customers) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (customers.length > 0) {
                try {
                    await mongoDb.collection('customers').insertMany(customers);
                    console.log(`✅ Migrated ${customers.length} customers`);
                } catch (error) {
                    console.error('❌ Error migrating customers:', error);
                }
            } else {
                console.log('ℹ️  No customers to migrate');
            }
            resolve();
        });
    });
}

function migrateBookings(mongoDb) {
    return new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM bookings', [], async (err, bookings) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (bookings.length > 0) {
                try {
                    await mongoDb.collection('bookings').insertMany(bookings);
                    console.log(`✅ Migrated ${bookings.length} bookings`);
                } catch (error) {
                    console.error('❌ Error migrating bookings:', error);
                }
            } else {
                console.log('ℹ️  No bookings to migrate');
            }
            resolve();
        });
    });
}

function migrateBlockedDates(mongoDb) {
    return new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM blocked_dates', [], async (err, blockedDates) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (blockedDates.length > 0) {
                try {
                    await mongoDb.collection('blocked_dates').insertMany(blockedDates);
                    console.log(`✅ Migrated ${blockedDates.length} blocked dates`);
                } catch (error) {
                    console.error('❌ Error migrating blocked dates:', error);
                }
            } else {
                console.log('ℹ️  No blocked dates to migrate');
            }
            resolve();
        });
    });
}

function migrateQuotes(mongoDb) {
    return new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM quotes', [], async (err, quotes) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (quotes.length > 0) {
                try {
                    await mongoDb.collection('quotes').insertMany(quotes);
                    console.log(`✅ Migrated ${quotes.length} quotes`);
                } catch (error) {
                    console.error('❌ Error migrating quotes:', error);
                }
            } else {
                console.log('ℹ️  No quotes to migrate');
            }
            resolve();
        });
    });
}

function migrateInvoices(mongoDb) {
    return new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM invoices', [], async (err, invoices) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (invoices.length > 0) {
                try {
                    await mongoDb.collection('invoices').insertMany(invoices);
                    console.log(`✅ Migrated ${invoices.length} invoices`);
                } catch (error) {
                    console.error('❌ Error migrating invoices:', error);
                }
            } else {
                console.log('ℹ️  No invoices to migrate');
            }
            resolve();
        });
    });
}

// Run migration
migrateData(); 