# 🔒 OAuth Security Guide

## ⚠️ CRITICAL SECURITY ISSUE FIXED

Your Google OAuth credentials were exposed in the frontend code. This has been fixed.

## 🔐 How to Secure Your Credentials

### 1. **Environment Variables** (Recommended)
Create a `.env` file in your project root:

```env
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/admin.html

# Microsoft OAuth (when you get them)
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here

# Admin Configuration
ADMIN_EMAIL=admin@stellartreemanagement.com
COMPANY_NAME=Stellar Tree Management
SESSION_TIMEOUT=120
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=15

# Allowed Admin Emails
ALLOWED_ADMIN_EMAILS=aiplanet100@gmail.com,stellartreemanagement@outlook.com
```

### 2. **Update server.js**
Replace the hardcoded credentials with environment variables:

```javascript
// OAuth Configuration
const ALLOWED_ADMIN_EMAILS = process.env.ALLOWED_ADMIN_EMAILS?.split(',') || [
    'aiplanet100@gmail.com',
    'stellartreemanagement@outlook.com'
];

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/admin.html';
```

### 3. **Install dotenv**
```bash
npm install dotenv
```

### 4. **Load environment variables**
Add to the top of server.js:
```javascript
require('dotenv').config();
```

## 🛡️ Security Best Practices

1. **Never commit credentials to Git**
2. **Use environment variables**
3. **Keep .env file in .gitignore**
4. **Rotate credentials regularly**
5. **Use HTTPS in production**

## 🔧 Current Status

✅ **Fixed:** Credentials removed from frontend
✅ **Fixed:** OAuth initialization issues
✅ **Fixed:** CORS headers added
✅ **Fixed:** Logout function added
✅ **Fixed:** Error handling improved

## 🧪 Testing

The system should now work properly. Test by:
1. Opening admin panel
2. Clicking "Sign in with Google"
3. Checking browser console for detailed logs 