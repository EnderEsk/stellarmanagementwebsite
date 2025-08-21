const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/healthz',
    method: 'GET'
};

console.log('Testing health check endpoint...');

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            console.log('Response:', JSON.stringify(jsonData, null, 2));
        } catch (e) {
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();

// Test ping endpoint after a short delay
setTimeout(() => {
    console.log('\nTesting ping endpoint...');
    const pingReq = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/ping',
        method: 'GET'
    }, (res) => {
        console.log(`Ping Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log('Ping Response:', JSON.stringify(jsonData, null, 2));
            } catch (e) {
                console.log('Raw ping response:', data);
            }
        });
    });
    
    pingReq.on('error', (e) => {
        console.error(`Problem with ping request: ${e.message}`);
    });
    
    pingReq.end();
}, 1000);
