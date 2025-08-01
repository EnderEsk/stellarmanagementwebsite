const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to generate a secure random password
function generateSecurePassword(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

// Function to ask questions
function question(query) {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function setup() {
    console.log('\n🔒 Stellar Tree Management - Security Setup\n');

    try {
        // Check if .env already exists
        if (fs.existsSync('.env')) {
            const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
            if (overwrite.toLowerCase() !== 'y') {
                console.log('❌ Setup cancelled');
                process.exit(0);
            }
        }

        // Get MongoDB URI
        console.log('\n📦 MongoDB Configuration:');
        const mongoUri = await question('Enter MongoDB URI (or press enter for default): ');

        // Generate admin password
        console.log('\n👤 Admin Configuration:');
        const useRandomPassword = await question('Generate random admin password? (Y/n): ');
        const adminPassword = useRandomPassword.toLowerCase() === 'n' 
            ? await question('Enter admin password: ')
            : generateSecurePassword(16);

        // Get admin email
        const adminEmail = await question('Enter admin email: ');

        // Get company name
        console.log('\n🏢 Company Configuration:');
        const companyName = await question('Enter company name (default: Stellar Tree Management): ');

        // Create .env content
        const envContent = `# Database Configuration
MONGODB_URI=${mongoUri || 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/stellartmanagement'}

# Server Configuration
PORT=3000
NODE_ENV=development

# Admin Configuration
ADMIN_PASSWORD=${adminPassword}
ADMIN_EMAIL=${adminEmail || 'admin@stellartreemanagement.com'}
SESSION_TIMEOUT=60
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=15

# Company Configuration
COMPANY_NAME=${companyName || 'Stellar Tree Management'}

# Email Configuration (for future implementation)
SMTP_HOST=smtp.outlook.com
SMTP_PORT=587
SMTP_USER=stellartmanagement@outlook.com
SMTP_PASS=your_email_password
`;

        // Write .env file
        fs.writeFileSync('.env', envContent);

        // Create necessary directories
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads');
        }
        if (!fs.existsSync('ssl')) {
            fs.mkdirSync('ssl');
        }

        // Create .gitkeep in uploads
        fs.writeFileSync('uploads/.gitkeep', '');

        console.log('\n✅ Setup completed successfully!');
        console.log('\n🔐 Security Information:');
        if (useRandomPassword.toLowerCase() !== 'n') {
            console.log(`Admin Password: ${adminPassword}`);
            console.log('⚠️  SAVE THIS PASSWORD NOW! It won\'t be shown again.');
        }
        console.log('\n📝 Next steps:');
        console.log('1. Update MongoDB URI in .env with your actual credentials');
        console.log('2. Configure email settings in .env if needed');
        console.log('3. Start the server with: npm start');
        
    } catch (error) {
        console.error('❌ Error during setup:', error);
    } finally {
        rl.close();
    }
}

setup(); 