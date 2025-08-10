// Test script for money spent calculation
// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000';

async function testMoneyCalculation() {
    console.log('🧪 Testing Money Spent Calculation...\n');

    try {
        // Test 1: Recalculate all customer totals
        console.log('1. Testing customer totals recalculation...');
        const recalcResponse = await fetch(`${BASE_URL}/api/customers/recalculate-totals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (recalcResponse.ok) {
            const result = await recalcResponse.json();
            console.log('✅ Recalculation result:', result.message);
        } else {
            console.log('❌ Recalculation failed');
            return;
        }

        // Test 2: Get all customers and check their totals
        console.log('\n2. Checking customer totals...');
        const customersResponse = await fetch(`${BASE_URL}/api/customers`);
        
        if (customersResponse.ok) {
            const customers = await customersResponse.json();
            console.log(`📊 Found ${customers.length} customers:`);
            
            customers.forEach(customer => {
                console.log(`   - ${customer.name} (${customer.customer_id}): $${(customer.total_spent || 0).toFixed(2)}`);
            });

            // Test 3: Get detailed customer info for first customer
            if (customers.length > 0) {
                console.log('\n3. Checking detailed customer info...');
                const firstCustomer = customers[0];
                const detailResponse = await fetch(`${BASE_URL}/api/customers/${firstCustomer.customer_id}`);
                
                if (detailResponse.ok) {
                    const details = await detailResponse.json();
                    console.log(`📋 Customer: ${details.customer.name}`);
                    console.log(`   - Total Bookings: ${details.customer.total_bookings || 0}`);
                    console.log(`   - Total Spent: $${(details.customer.total_spent || 0).toFixed(2)}`);
                    console.log(`   - Bookings: ${details.bookings.length}`);
                    console.log(`   - Quotes: ${details.quotes.length}`);
                    console.log(`   - Invoices: ${details.invoices.length}`);
                    
                    // Show completed bookings
                    const completedBookings = details.bookings.filter(b => b.status === 'completed');
                    console.log(`   - Completed Bookings: ${completedBookings.length}`);
                    
                    // Show paid invoices
                    const paidInvoices = details.invoices.filter(i => i.payment_status === 'paid');
                    console.log(`   - Paid Invoices: ${paidInvoices.length}`);
                    
                    if (paidInvoices.length > 0) {
                        const totalPaid = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
                        console.log(`   - Total from Paid Invoices: $${totalPaid.toFixed(2)}`);
                    }
                } else {
                    console.log('❌ Failed to fetch customer details');
                }
            }
        } else {
            console.log('❌ Failed to fetch customers');
        }

        console.log('\n✅ Money calculation test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testMoneyCalculation(); 