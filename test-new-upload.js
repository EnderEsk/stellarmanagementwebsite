const fs = require('fs');
const path = require('path');

console.log('🧪 Testing new image upload functionality...\n');

// Check if the server is running
const http = require('http');
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin-config',
    method: 'GET',
    headers: {
        'x-admin-auth': 'stellar2024'
    }
};

const req = http.request(options, (res) => {
    console.log('✅ Server is running and accessible');
    console.log('📊 Status:', res.statusCode);
    
    if (res.statusCode === 200) {
        console.log('🎯 Ready to test image uploads!');
        console.log('\n📋 Next steps:');
        console.log('1. Go to the booking form at http://localhost:3000/booking/');
        console.log('2. Create a new booking with an image');
        console.log('3. Check the admin panel to see if the image displays');
        console.log('4. The image should be stored in MongoDB and served correctly');
    }
});

req.on('error', (e) => {
    console.log('❌ Server not running or not accessible');
    console.log('💡 Make sure to start the server with: ADMIN_PASSWORD=stellar2024 node server.js');
});

req.end();

// Check uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    console.log(`\n📁 Uploads directory contains ${files.length} files`);
    if (files.length > 0) {
        console.log('📸 Files found:');
        files.forEach(file => {
            const stats = fs.statSync(path.join(uploadsDir, file));
            console.log(`  - ${file} (${(stats.size / 1024).toFixed(2)}KB)`);
        });
    }
} else {
    console.log('\n📁 Uploads directory does not exist (this is normal for MongoDB storage)');
} 