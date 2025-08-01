# Stellar Tree Management System

A comprehensive booking and management system for tree services, featuring customer management, booking system, quotes, and invoices.

## 🔒 Security Setup (IMPORTANT)

Before running the application, you must set up your environment variables:

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your secure values:
```env
# Get this from MongoDB Atlas
MONGODB_URI=your_mongodb_connection_string

# Change this to a secure password
ADMIN_PASSWORD=your_secure_admin_password

# Update with your email
ADMIN_EMAIL=your@email.com
```

## 📋 Prerequisites

- Node.js (v14.0.0 or higher)
- MongoDB Atlas account
- npm or yarn

## 🚀 Installation

1. Clone the repository (DO NOT include .env file)
```bash
git clone <repository-url>
cd stellartmanagement
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables (see Security Setup above)

4. Create uploads directory
```bash
mkdir -p uploads
```

5. Start the server
```bash
npm start
```

## 🌐 Access Points

- Main website: `http://localhost:3000`
- Booking page: `http://localhost:3000/booking/`
- Admin panel: `http://localhost:3000/admin.html`

## 📦 Features

- 📅 Booking System
  - Real-time availability
  - Double booking prevention
  - Image uploads
  - Email notifications (requires setup)

- 💼 Admin Panel
  - Booking management
  - Customer management
  - Quote generation
  - Invoice management

- 📊 Customer Management
  - Customer profiles
  - Booking history
  - Spending tracking
  - Contact information

## 🔐 Security Notes

- NEVER commit `.env` file
- NEVER commit SSL certificates
- NEVER commit `uploads` directory content
- ALWAYS use environment variables for sensitive data
- Keep MongoDB connection string private
- Regularly update admin password

## 📁 Directory Structure

```
stellartmanagement/
├── .env.example          # Template for environment variables
├── .gitignore           # Git ignore rules
├── server.js            # Main server file
├── database.js          # Database connection
├── admin-config.js      # Admin configuration
├── booking/            # Booking system files
├── uploads/            # Upload directory (git ignored)
└── ssl/               # SSL certificates (git ignored)
```

## 🛠️ Development

1. Start in development mode:
```bash
npm run dev
```

2. Run tests:
```bash
npm test
```

## 📝 Environment Variables

Required environment variables:

- `MONGODB_URI`: MongoDB connection string
- `ADMIN_PASSWORD`: Admin panel password
- `NODE_ENV`: 'development' or 'production'
- `PORT`: Server port (default: 3000)

Optional environment variables:

- `SESSION_TIMEOUT`: Admin session timeout in minutes
- `MAX_LOGIN_ATTEMPTS`: Maximum login attempts
- `LOCKOUT_DURATION`: Account lockout duration
- `SMTP_*`: Email configuration (if using email)

## 🤝 Contributing

1. Create a new branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For support, email support@stellartreemanagement.com

