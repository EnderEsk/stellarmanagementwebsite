// Debug script for money calculation
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'bookings.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Debugging Money Calculation...\n');

// Check customers table
db.all('SELECT customer_id, name, total_spent, total_bookings FROM customers', [], (err, customers) => {
    if (err) {
        console.error('Error querying customers:', err);
        return;
    }
    
    console.log('📋 Customers:');
    customers.forEach(customer => {
        console.log(`   - ${customer.name} (${customer.customer_id}): $${customer.total_spent}, ${customer.total_bookings} bookings`);
    });
    
    // Check bookings table
    db.all('SELECT booking_id, customer_id, service, status FROM bookings', [], (err, bookings) => {
        if (err) {
            console.error('Error querying bookings:', err);
            return;
        }
        
        console.log('\n📅 Bookings:');
        bookings.forEach(booking => {
            console.log(`   - ${booking.booking_id}: ${booking.service} (${booking.status}) - Customer: ${booking.customer_id || 'NULL'}`);
        });
        
        // Check invoices table
        db.all('SELECT invoice_id, customer_id, total_amount, payment_status FROM invoices', [], (err, invoices) => {
            if (err) {
                console.error('Error querying invoices:', err);
                return;
            }
            
            console.log('\n💰 Invoices:');
            invoices.forEach(invoice => {
                console.log(`   - ${invoice.invoice_id}: $${invoice.total_amount} (${invoice.payment_status}) - Customer: ${invoice.customer_id || 'NULL'}`);
            });
            
            // Manual calculation for first customer
            if (customers.length > 0) {
                const customer = customers[0];
                console.log(`\n🧮 Manual calculation for ${customer.name}:`);
                
                // Count completed bookings
                db.get('SELECT COUNT(*) as count FROM bookings WHERE customer_id = ? AND status = "completed"', 
                    [customer.customer_id], (err, result) => {
                    if (err) {
                        console.error('Error counting completed bookings:', err);
                        return;
                    }
                    
                    const completedBookings = result.count;
                    console.log(`   - Completed bookings: ${completedBookings}`);
                    
                    // Sum paid invoices
                    db.get('SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE customer_id = ? AND payment_status = "paid"', 
                        [customer.customer_id], (err, result) => {
                        if (err) {
                            console.error('Error summing paid invoices:', err);
                            return;
                        }
                        
                        const paidInvoices = result.total;
                        console.log(`   - Paid invoices: $${paidInvoices}`);
                        
                        const calculatedTotal = (completedBookings * 150) + paidInvoices;
                        console.log(`   - Calculated total: $${calculatedTotal}`);
                        console.log(`   - Database total: $${customer.total_spent}`);
                        
                        if (calculatedTotal !== customer.total_spent) {
                            console.log('   ❌ MISMATCH! Database total is incorrect.');
                        } else {
                            console.log('   ✅ Match! Database total is correct.');
                        }
                        
                        db.close();
                    });
                });
            } else {
                db.close();
            }
        });
    });
}); 