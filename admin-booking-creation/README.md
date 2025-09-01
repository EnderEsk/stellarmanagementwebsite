# Admin Booking Creation System

This system allows administrators to create bookings directly from the admin panel, similar to the quote creation process but with a streamlined workflow.

## Features

- **Direct Booking Creation**: Admins can create bookings without going through the public booking form
- **Required Fields Only**: Only Name and Email are required fields
- **Automatic Date Setting**: Default date is set to "today" (current date)
- **Service Item Management**: Add, remove, and configure service items with pricing
- **Cost Calculation**: Automatic subtotal, tax, and total calculation
- **Quote Stage Integration**: Created bookings automatically enter the quote stage workflow
- **Email Notifications**: Automatic emails sent to customers and admins

## File Structure

```
admin-booking-creation/
├── admin-booking-creation.js    # Main JavaScript functionality
├── admin-booking-creation.css   # Styling for the modal
└── README.md                    # This documentation
```

## How It Works

### 1. Access
- Click the "Create Booking" button in the admin panel header
- The button is located next to the "Refresh" button in the section header

### 2. Modal Interface
The system opens a popup modal with the following sections:

#### Customer Information
- **Name** (required): Customer's full name
- **Email** (required): Customer's email address
- **Phone**: Customer's phone number (optional)
- **Address**: Customer's address (optional)

#### Service Information
- **Service Type** (required): Tree Removal, Trimming & Pruning, Stump Grinding, or Emergency Service
- **Date** (required): Booking date (defaults to today)
- **Time** (required): 5:30 PM, 6:30 PM, or 7:30 PM
- **Notes**: Additional service notes (optional)

#### Service Items
- **Dynamic Service Items**: Add/remove service items as needed
- **Description**: Service item description
- **Quantity**: Number of units
- **Unit Price**: Price per unit
- **Automatic Total**: Calculated per item and overall

#### Cost Summary
- **Subtotal**: Sum of all service items
- **Tax Toggle**: Include 8.25% tax (optional)
- **Grand Total**: Final amount including tax

### 3. Validation
The system validates:
- Required fields (Name, Email, Service, Date, Time)
- Email format
- Date (cannot be in the past)
- Weekend restrictions (unless explicitly unblocked)
- Double booking conflicts
- Maximum active bookings per customer (3)

### 4. Booking Creation
When submitted:
1. Generates unique booking ID with "ST" prefix (consistent with regular bookings)
2. Creates booking with "quote-ready" status (ready for quote creation)
3. Sends confirmation email to customer
4. Sends notification email to admin
5. Refreshes the admin panel to show new booking
6. Closes modal and shows success message

## API Endpoint

The system uses a new API endpoint: `/api/admin/bookings`

**Method**: POST  
**Authentication**: Required (admin only)  
**Content-Type**: application/json

### Request Body
```json
{
  "booking_id": "ST-MEYV1FB9-CLGNK",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-1234",
  "address": "123 Main St",
  "service": "Tree Removal",
  "date": "2025-01-15",
  "time": "5:30 PM",
  "notes": "Large oak tree in backyard",
  "service_items": [
    {
      "description": "Tree removal and cleanup",
      "quantity": 1,
      "unitPrice": 500
    }
  ],
  "estimated_cost": 500
}
```

### Response
```json
{
  "message": "Admin booking created successfully",
  "bookingId": "ADMIN-1234567890-abcde",
  "id": "507f1f77bcf86cd799439011",
  "status": "pending"
}
```

## Integration

### With Existing System
- **Seamless Integration**: Works alongside existing admin panel functionality
- **No Disruption**: All existing UI elements remain unchanged
- **Consistent Workflow**: Follows the same booking lifecycle as customer-created bookings

### Booking Lifecycle
1. **Created** → Status: "pending" (Quote Stage)
2. **Quote Ready** → Admin creates quote
3. **Quote Sent** → Quote sent to customer
4. **Job Scheduled** → Customer confirms booking
5. **Invoice Ready** → Admin creates invoice
6. **Invoice Sent** → Invoice sent to customer
7. **Completed** → Job completed and marked as paid

## Styling

The system uses CSS custom properties for consistent theming:
- **Primary Color**: `var(--admin-primary)` - #2a2a2a
- **Accent Color**: `var(--admin-accent)` - #8cc63f
- **Secondary Color**: `var(--admin-secondary)` - #5a5a5a

## Responsive Design

The modal is fully responsive and works on:
- Desktop (900px max-width)
- Tablet (768px and below)
- Mobile (480px and below)

## Error Handling

The system provides comprehensive error handling:
- **Form Validation**: Client-side validation with clear error messages
- **API Error Handling**: Server-side validation and error responses
- **User Feedback**: Success/error notifications using existing notification system
- **Fallback Notifications**: Built-in notification system if external one unavailable

## Security

- **Admin Authentication**: Requires valid admin session
- **Input Sanitization**: All user inputs are sanitized
- **CSRF Protection**: Uses existing authentication headers
- **Rate Limiting**: Inherits existing rate limiting from server

## Troubleshooting

### Common Issues

1. **Modal Not Opening**
   - Check browser console for JavaScript errors
   - Verify admin-booking-creation.js is loaded
   - Ensure user is authenticated as admin

2. **Form Submission Fails**
   - Check required fields are filled
   - Verify date is not in the past
   - Check for double booking conflicts
   - Ensure valid service type selected

3. **Styling Issues**
   - Verify admin-booking-creation.css is loaded
   - Check for CSS conflicts with existing styles
   - Ensure CSS custom properties are defined

### Debug Mode

Enable debug logging by checking browser console:
- Look for "✅ Admin Booking Creation system initialized"
- Check for any error messages during form submission
- Verify API calls are being made to correct endpoint

## Future Enhancements

Potential improvements for future versions:
- **Bulk Booking Creation**: Create multiple bookings at once
- **Template System**: Save and reuse common service configurations
- **Customer Search**: Search existing customers to avoid duplicates
- **Calendar Integration**: Direct calendar view for date selection
- **Service Templates**: Predefined service packages with pricing
