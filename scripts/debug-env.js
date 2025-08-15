// Debug script to check environment variables
console.log('=== Environment Variables Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0);
console.log('MONGODB_URI starts with mongodb:', process.env.MONGODB_URI ? process.env.MONGODB_URI.startsWith('mongodb') : false);

if (process.env.MONGODB_URI) {
    console.log('MONGODB_URI preview:', process.env.MONGODB_URI.substring(0, 50) + '...');
} else {
    console.log('❌ MONGODB_URI is not set!');
}

console.log('=== End Debug ==='); 