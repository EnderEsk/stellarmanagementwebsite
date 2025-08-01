const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;

async function connectToDatabase() {
    try {
        await client.connect();
        db = client.db('stellartmanagement');
        console.log('✅ Connected to MongoDB Atlas');
        
        // Create indexes for better performance
        await createIndexes();
        
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function createIndexes() {
    try {
        // Customer indexes
        await db.collection('customers').createIndex({ customer_id: 1 }, { unique: true });
        await db.collection('customers').createIndex({ phone: 1 });
        await db.collection('customers').createIndex({ email: 1 });
        
        // Booking indexes
        await db.collection('bookings').createIndex({ booking_id: 1 }, { unique: true });
        await db.collection('bookings').createIndex({ customer_id: 1 });
        await db.collection('bookings').createIndex({ date: 1, time: 1 });
        await db.collection('bookings').createIndex({ email: 1 });
        
        // Blocked dates index
        await db.collection('blocked_dates').createIndex({ date: 1 }, { unique: true });
        
        // Quote indexes
        await db.collection('quotes').createIndex({ quote_id: 1 }, { unique: true });
        await db.collection('quotes').createIndex({ customer_id: 1 });
        
        // Invoice indexes
        await db.collection('invoices').createIndex({ invoice_id: 1 }, { unique: true });
        await db.collection('invoices').createIndex({ customer_id: 1 });
        
        console.log('✅ Database indexes created');
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
    }
}

function getDatabase() {
    return db;
}

async function closeConnection() {
    await client.close();
}

module.exports = {
    connectToDatabase,
    getDatabase,
    closeConnection
}; 