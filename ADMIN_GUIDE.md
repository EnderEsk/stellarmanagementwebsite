# Admin Panel Access Guide - Stellar Tree Management

## 🔐 **How to Access the Admin Panel**

### **Direct Access:**
1. **URL**: `http://localhost:3000/admin.html` (when running locally)
2. **Production URL**: `https://yourdomain.com/admin.html` (when deployed)

### **Default Login Credentials:**
- **Password**: `stellar2024`

### **Login Process:**
1. Navigate to the admin panel URL
2. Enter the admin password
3. Click "Access Dashboard" or press Enter
4. You'll be redirected to the admin dashboard

## 🔒 **Security Features**

### **Current Security Measures:**
- ✅ **Password Protection** - Required to access admin panel
- ✅ **Session Management** - Stays logged in during browser session
- ✅ **Logout Function** - Clear session when done
- ✅ **No Public Links** - Admin panel not linked from public pages

### **Recommended Security Enhancements:**

#### **1. Change Default Password**
Edit `admin-config.js`:
```javascript
const ADMIN_CONFIG = {
    PASSWORD: 'your-strong-password-here', // Change this!
    // ... other settings
};
```

#### **2. Use Strong Password**
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Avoid common words or patterns
- Example: `St3ll@rTr33M@n@g3m3nt2024!`

#### **3. Additional Security Options**

**Option A: IP Restriction (Server-side)**
Add to `server.js`:
```javascript
// Add this middleware before your routes
app.use('/admin.html', (req, res, next) => {
    const allowedIPs = ['127.0.0.1', '::1', 'your-office-ip'];
    if (!allowedIPs.includes(req.ip)) {
        return res.status(403).send('Access Denied');
    }
    next();
});
```

**Option B: Environment Variable Password**
```javascript
// In admin-config.js
const ADMIN_CONFIG = {
    PASSWORD: process.env.ADMIN_PASSWORD || 'stellar2024',
    // ... other settings
};
```

**Option C: Database-based Authentication**
Create admin users table and implement proper authentication.

## 🛡️ **Best Practices**

### **Access Control:**
1. **Never share admin password** with unauthorized personnel
2. **Use different passwords** for different environments (dev/prod)
3. **Regular password changes** (every 3-6 months)
4. **Logout when done** - especially on shared computers

### **Network Security:**
1. **HTTPS only** in production
2. **Firewall rules** to restrict access
3. **VPN access** for remote administration
4. **Monitor access logs** for suspicious activity

### **Browser Security:**
1. **Private/Incognito mode** for admin access
2. **Clear browser cache** after logout
3. **Don't save password** in browser
4. **Use dedicated admin browser** if possible

## 📱 **Admin Panel Features**

### **Dashboard Overview:**
- **Total Bookings** - All-time booking count
- **Pending Bookings** - Awaiting confirmation
- **Confirmed Bookings** - Approved appointments
- **Upcoming Bookings** - Future appointments

### **Booking Management:**
- **View all bookings** in organized table
- **Update booking status** (pending/confirmed/completed/cancelled)
- **Real-time refresh** of booking data
- **Customer information** display

### **Actions Available:**
- **Confirm** - Mark booking as confirmed
- **Complete** - Mark service as completed
- **Cancel** - Cancel booking
- **Refresh** - Update booking list

## 🔧 **Configuration Options**

### **Session Settings** (`admin-config.js`):
```javascript
const ADMIN_CONFIG = {
    PASSWORD: 'your-password',
    SESSION_TIMEOUT: 60,        // Minutes (0 = no timeout)
    MAX_LOGIN_ATTEMPTS: 5,       // Before lockout
    LOCKOUT_DURATION: 15,        // Minutes
    ADMIN_EMAIL: 'admin@yourcompany.com',
    COMPANY_NAME: 'Your Company Name'
};
```

### **Customization:**
- **Company branding** in admin panel
- **Email notifications** for new bookings
- **Session timeout** for security
- **Login attempt limits** to prevent brute force

## 🚨 **Emergency Access**

### **If You Forget Password:**
1. **Edit `admin-config.js`** and change the password
2. **Restart the server** (`npm start`)
3. **Clear browser cache** and cookies
4. **Login with new password**

### **If Admin Panel is Compromised:**
1. **Change password immediately**
2. **Check server logs** for unauthorized access
3. **Review recent bookings** for suspicious activity
4. **Consider IP restrictions** for additional security

## 📊 **Monitoring & Maintenance**

### **Regular Tasks:**
- **Review booking statistics** weekly
- **Update booking statuses** promptly
- **Monitor for unusual activity**
- **Backup booking database** regularly

### **Database Backup:**
```bash
# Backup database
cp bookings.db bookings_backup_$(date +%Y%m%d).db

# Restore if needed
cp bookings_backup_20241201.db bookings.db
```

## 🌐 **Production Deployment**

### **Security Checklist:**
- [ ] **Change default password**
- [ ] **Enable HTTPS**
- [ ] **Set up firewall rules**
- [ ] **Configure backup system**
- [ ] **Monitor access logs**
- [ ] **Test all admin functions**

### **Recommended Setup:**
1. **Use environment variables** for sensitive data
2. **Implement rate limiting** for login attempts
3. **Set up monitoring** for failed login attempts
4. **Regular security audits** of the system

## 📞 **Support**

### **For Technical Issues:**
- Check server logs for errors
- Verify database connectivity
- Test API endpoints directly
- Review browser console for JavaScript errors

### **For Security Concerns:**
- Change password immediately
- Review access logs
- Consider additional security measures
- Contact your web developer

---

**⚠️ Important**: This admin panel contains sensitive business data. Always follow security best practices and never share access credentials with unauthorized personnel. 