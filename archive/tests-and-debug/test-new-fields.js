// Test script for new phone and address fields
// Run this in the browser console to test the functionality

console.log('Testing new phone and address fields...');

// Test phone number formatting
function testPhoneFormatting() {
    const phoneInput = document.getElementById('phone');
    if (!phoneInput) {
        console.error('Phone input not found');
        return;
    }
    
    // Test phone formatting
    const testNumbers = ['1234567890', '5551234567', '123456789'];
    
    testNumbers.forEach(number => {
        phoneInput.value = number;
        phoneInput.dispatchEvent(new Event('input'));
        console.log(`Input: ${number} -> Formatted: ${phoneInput.value}`);
    });
}

// Test address autocomplete (if Geoapify API is available)
function testAddressAutocomplete() {
    const addressInput = document.getElementById('address');
    if (!addressInput) {
        console.error('Address input not found');
        return;
    }
    
    if (window.GEOAPIFY_API_KEY) {
        console.log('Geoapify API key is configured');
        
        // Test the API directly
        const testQuery = '123 Main St';
        const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(testQuery)}&apiKey=${window.GEOAPIFY_API_KEY}&limit=3&country=ca&format=json`;
        
        fetch(url)
            .then(response => response.json())
            .then(result => {
                console.log('Geoapify API test result:', result);
                if (result.results && result.results.length > 0) {
                    console.log('✅ Address autocomplete is working');
                    console.log('Sample suggestions:', result.results.map(r => r.formatted));
                } else {
                    console.log('⚠️ No suggestions returned');
                }
            })
            .catch(error => {
                console.error('❌ Geoapify API test failed:', error);
            });
        
        // Test with a sample address
        addressInput.value = testQuery;
        addressInput.dispatchEvent(new Event('input'));
    } else {
        console.log('Geoapify API key not found - address autocomplete will not work');
    }
}

// Test form validation
function testFormValidation() {
    const form = document.getElementById('bookingForm');
    if (!form) {
        console.error('Booking form not found');
        return;
    }
    
    // Test with empty fields
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const addressInput = document.getElementById('address');
    
    if (nameInput && emailInput && phoneInput && addressInput) {
        console.log('All required fields found');
        
        // Test validation by trying to submit with empty fields
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            console.log('Testing form validation...');
            submitButton.click();
        }
    }
}

// Run tests if we're on the booking page
if (window.location.pathname.includes('/booking')) {
    console.log('Running tests on booking page...');
    setTimeout(() => {
        testPhoneFormatting();
        testAddressAutocomplete();
        testFormValidation();
    }, 1000);
} else {
    console.log('Not on booking page - tests skipped');
}

console.log('Test script loaded. Check console for results.'); 