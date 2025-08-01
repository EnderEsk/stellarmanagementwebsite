# Stellar Tree Management - Self-Booking System

A comprehensive, user-friendly self-booking system for Stellar Tree Management that allows customers to book tree care services online with real-time availability checking and double booking prevention.

## Features

### 🎯 Core Functionality
- **Multi-step booking process** (Service → Date → Time → Contact Info)
- **Real-time availability checking** to prevent double bookings
- **Interactive calendar** with working days and time slot selection
- **Mobile responsive design** that works on all devices
- **SQLite database** for reliable data storage
- **Booking confirmation** with unique booking IDs
- **Form validation** with user-friendly error messages

### 🎨 User Experience
- **Seamless integration** with existing website design
- **Modern UI/UX** with smooth animations and transitions
- **Step-by-step guidance** for easy booking process
- **Instant feedback** with notifications and loading states
- **Booking summary** before confirmation
- **Success confirmation** with booking details

### 🔧 Technical Features
- **RESTful API** with comprehensive endpoints
- **Database indexing** for optimal performance
- **Error handling** and graceful degradation
- **CORS support** for cross-origin requests
- **Security validation** on all inputs
- **Email notification system** (placeholder for integration)

## System Requirements

- **Node.js** version 14.0.0 or higher
- **npm** or **yarn** package manager
- **Modern web browser** with JavaScript enabled

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 3. Access the Booking System
- **Main website**: http://localhost:3000
- **Booking page**: http://localhost:3000/booking/
- **Admin dashboard**: http://localhost:3000/admin.html
- **API endpoints**: http://localhost:3000/api/*

## Configuration

### Business Hours (in booking/booking.js)
```javascript
this.businessHours = {
    start: 9,        // 9 AM
    end: 17,         // 5 PM
    slotDuration: 60, // 60 minutes per slot
    maxBookingsPerDay: 8,
    workingDays: [1, 2, 3, 4, 5, 6] // Monday to Saturday
};
```

### Customization Options
- **Time slots**: Modify `start`, `end`, and `slotDuration`
- **Working days**: Update `workingDays` array (0=Sunday, 1=Monday, etc.)
- **Max bookings**: Adjust `maxBookingsPerDay` per time slot
- **Services**: Add/modify services in `booking/index.html`

## API Endpoints

### GET /api/bookings
Get all bookings
```json
{
  "id": 1,
  "booking_id": "ST-ABC123",
  "service": "Tree Removal",
  "date": "2024-12-15",
  "time": "10:00",
  "name": "John Doe",
  "email": "john@example.com",
  "notes": "Large oak tree",
  "status": "pending",
  "created_at": "2024-12-01T10:00Z"
}
```

### POST /api/bookings
Create new booking
```json
{
  "booking_id": "ST-ABC123",
  "service": "Tree Removal",
  "date": "2024-12-15",
  "time": "10:00",
  "name": "John Doe",
  "email": "john@example.com",
  "notes": "Large oak tree"
}
```

### GET /api/bookings/date/:date
Get bookings for specific date

### PATCH /api/bookings/:bookingId/status
Update booking status
```json
{
  "status": "confirmed"
}
```

### GET /api/bookings/stats/overview
Get booking statistics

## Database Schema

### Bookings Table
```sql
CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT UNIQUE NOT NULL,
    service TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## File Structure

```
stellartreemanagement/
├── booking/              # Booking system folder
│   ├── index.html        # Main booking page
│   ├── booking.css       # Booking system styles
│   └── booking.js        # Frontend booking logic
├── server.js             # Backend API server
├── package.json          # Node.js dependencies
├── bookings.db           # SQLite database (auto-created)
├── admin.html            # Admin dashboard
├── index.html            # Main website (updated with booking link)
├── style.css             # Main website styles
└── BOOKING_README.md     # This file
```

## Customization Guide

### Adding New Services
1. Edit `booking/index.html` - Add new service option in step 1
2. Update service descriptions and icons as needed

### Changing Business Hours
1. Edit `booking/booking.js` - Modify `businessHours` object
2. Restart server for changes to take effect

### Styling Customization
1. Edit `booking.css` - Modify colors, fonts, layouts
2. Uses CSS custom properties for easy theming

### Email Integration
1. Replace `sendConfirmationEmail()` function in `server.js`
2. Integrate with services like SendGrid, Mailgun, or AWS SES

## Security Features

- **Input validation** on all form fields
- **SQL injection prevention** using parameterized queries
- **Double booking prevention** with database constraints
- **CORS configuration** for secure cross-origin requests
- **Error handling** without exposing sensitive information

## Performance Optimizations

- **Database indexing** on frequently queried columns
- **Efficient queries** with proper WHERE clauses
- **Static file serving** for fast page loads
- **Minimal JavaScript** with optimized event handling
- **CSS animations** using GPU acceleration

## Troubleshooting

### Common Issues

**Server won't start**
- Check Node.js version: `node --version`
- Ensure all dependencies installed: `npm install`
- Check port availability (default: 3000)

**Database errors**
- Ensure write permissions in project directory
- Check SQLite installation
- Verify database file path

**Booking not saving**
- Check server logs for errors
- Verify API endpoint accessibility
- Ensure all required fields are filled

**Calendar not working**
- Check JavaScript console for errors
- Verify date format compatibility
- Ensure business hours configuration is correct

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=* npm start
```

## Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
1. Install dependencies: `npm install --production`
2. Start server: `npm start`
3. Configure reverse proxy (nginx/Apache) if needed
4. Set up SSL certificate for HTTPS
5. Configure environment variables

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

## Support & Maintenance

### Regular Maintenance
- **Database backups**: Regular SQLite database backups
- **Log monitoring**: Check server logs for errors
- **Performance monitoring**: Monitor API response times
- **Security updates**: Keep dependencies updated

### Backup Strategy
```bash
# Backup database
cp bookings.db bookings_backup_$(date +%Y%m%d).db

# Restore database
cp bookings_backup_20241201.db bookings.db
```

## Future Enhancements

- **Admin dashboard** for booking management
- **Email/SMS notifications** integration
- **Payment processing** integration
- **Calendar sync** (Google Calendar, Outlook)
- **Customer portal** for booking history
- **Automated reminders** system
- **Multi-language support**
- **Advanced reporting** and analytics

## License

MIT License - See LICENSE file for details

## Contact

For support or questions about the booking system:
- **Email**: support@stellartreemanagement.com
- **Phone**: 403-555-0123
- **Website**: https://stellartreemanagement.com

---

**Note**: This booking system is designed specifically for Stellar Tree Management and integrates seamlessly with the existing website design and branding. 