// Test Admin Panel Password
// This script tests the admin configuration

console.log('🔐 Testing Admin Panel Configuration...\n');

// Check if admin-config.js is loaded
if (typeof window !== 'undefined' && window.ADMIN_CONFIG) {
    console.log('✅ Admin config loaded successfully');
    console.log('📋 Configuration:', window.ADMIN_CONFIG);
    console.log('🔑 Password:', window.ADMIN_CONFIG.PASSWORD);
} else {
    console.log('❌ Admin config not found');
    console.log('💡 Make sure admin-config.js is properly loaded');
}

// Test password validation logic
function testPasswordValidation(inputPassword, expectedPassword) {
    const isValid = inputPassword === expectedPassword;
    console.log(`\n🧪 Testing password: "${inputPassword}"`);
    console.log(`Expected: "${expectedPassword}"`);
    console.log(`Result: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    return isValid;
}

// Test cases
console.log('\n📝 Running password tests...');

// Test 1: Correct password
testPasswordValidation('stellar2024', 'stellar2024');

// Test 2: Wrong password
testPasswordValidation('wrongpassword', 'stellar2024');

// Test 3: Empty password
testPasswordValidation('', 'stellar2024');

// Test 4: Case sensitivity
testPasswordValidation('STELLAR2024', 'stellar2024');

console.log('\n🎯 Admin panel should be accessible at: http://localhost:3000/admin.html');
console.log('🔑 Use password: stellar2024'); 