#!/usr/bin/env node

/**
 * Reset Balance Script
 * Resets the remaining balance for admin billing back to initial balance
 * 
 * Usage:
 *   node scripts/reset-balance.js [admin-email]
 * 
 * If no email is provided, resets for all admins
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stellartmanagement';
const INITIAL_BALANCE = parseInt(process.env.INITIAL_BALANCE) || 244300; // $2443.00 in cents

async function resetBalance(adminEmail = null) {
    let client;
    
    try {
        console.log('Connecting to database...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db();
        const billingCollection = db.collection('admin_billing');
        
        const query = adminEmail ? { admin_email: adminEmail } : {};
        
        if (adminEmail) {
            console.log(`Resetting balance for: ${adminEmail}`);
        } else {
            console.log('Resetting balance for all admins...');
        }
        
        const result = await billingCollection.updateMany(
            query,
            {
                $set: {
                    remaining_balance: INITIAL_BALANCE,
                    updated_at: new Date()
                }
            },
            { upsert: false }
        );
        
        console.log(`✅ Successfully reset balance for ${result.modifiedCount} admin(s)`);
        console.log(`   Initial balance: $${(INITIAL_BALANCE / 100).toFixed(2)} USD`);
        
        if (adminEmail && result.modifiedCount === 0) {
            console.log(`⚠️  No record found for ${adminEmail}. Creating new record...`);
            await billingCollection.updateOne(
                { admin_email: adminEmail },
                {
                    $set: {
                        admin_email: adminEmail,
                        remaining_balance: INITIAL_BALANCE,
                        updated_at: new Date()
                    },
                    $setOnInsert: {
                        created_at: new Date()
                    }
                },
                { upsert: true }
            );
            console.log(`✅ Created new record with initial balance`);
        }
        
    } catch (error) {
        console.error('❌ Error resetting balance:', error);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('Database connection closed');
        }
    }
}

// Get admin email from command line arguments
const adminEmail = process.argv[2] || null;

resetBalance(adminEmail)
    .then(() => {
        console.log('Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });

