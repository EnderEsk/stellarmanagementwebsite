# Booking Restrictions System

## Overview

The Booking Restrictions System allows administrators to control when customers can schedule their jobs after accepting a quote. This system provides granular control over:

- **Allowed Booking Days**: Which days of the week customers can book
- **Job Duration**: How many consecutive days the job will take
- **Custom Date Selection**: Specific dates when booking is allowed

## Features

### 1. Allowed Booking Days

Administrators can choose from four options:

- **Weekends Only**: Customers can only book on weekends (all day availability)
- **Weekdays Only**: Customers can only book on weekdays at specific times (5:30 PM, 6:30 PM, 7:30 PM)
- **Both**: Customers can book on both weekends (all day) and weekdays (specific times)
- **Custom**: Administrators can select specific dates when booking is allowed

### 2. Job Duration Control

- **Default**: 1 day (customers select any single available day)
- **Configurable**: 1-7 days (customers must select consecutive days)
- **Auto-selection**: For multi-day jobs, the system can automatically suggest consecutive days

### 3. Time Slot Restrictions

- **Weekends**: All day availability (no time slot selection needed)
- **Weekdays**: Limited to 5:30 PM, 6:30 PM, or 7:30 PM only
- **Custom Dates**: Follow the same rules (weekend = all day, weekday = specific times)

## Implementation Details

### Database Schema

The system adds new fields to the `quotes` collection:

```javascript
{
  // ... existing quote fields ...
  booking_restrictions: {
    allowed_days: 'weekends' | 'weekdays' | 'both' | 'custom',
    custom_dates: ['2025-08-16', '2025-08-17'], // Array of date strings
    job_duration_days: 1 // Number of consecutive days required
  }
}
```

### API Endpoints

#### New Endpoints

- `GET /api/quotes/:quoteId/booking-restrictions` - Get booking restrictions for a specific quote

#### Updated Endpoints

- `POST /api/quotes` - Now accepts `booking_restrictions` in the request body
- `PUT /api/quotes/:quoteId` - Now accepts `booking_restrictions` in the request body

### Frontend Components

#### Admin Panel (admin.html)

1. **Quote Modal**: New "Booking Restrictions" section with:
   - Dropdown for allowed days selection
   - Number input for job duration
   - Custom date picker modal for custom date selection

2. **Custom Date Picker**: Interactive calendar for selecting specific available dates

#### Customer Booking Status (booking-status.html)

- Displays booking restrictions information when quote is accepted
- Shows job duration and available days clearly

#### Job Scheduling (schedule-job.html)

- Enforces booking restrictions in the calendar
- Only shows available dates based on restrictions
- Displays restrictions information prominently

## Usage Instructions

### For Administrators

1. **Create/Edit Quote**:
   - Fill in quote details as usual
   - In the "Booking Restrictions" section:
     - Select allowed booking days
     - Set job duration (1-7 days)
     - If selecting "Custom", use the date picker to select specific dates

2. **Custom Date Selection**:
   - Click "Add Custom Dates" button
   - Navigate through months using arrow buttons
   - Click dates to select/deselect them
   - Weekends are highlighted and marked as "all day"
   - Weekdays are marked with time restrictions

### For Customers

1. **View Restrictions**: After accepting a quote, restrictions are clearly displayed
2. **Schedule Job**: Calendar only shows available dates based on restrictions
3. **Multi-day Selection**: Must select consecutive days matching the job duration

## Technical Implementation

### Calendar Enforcement

The system modifies the calendar rendering logic to:

1. **Filter Available Dates**: Based on `allowed_days` setting
2. **Apply Custom Dates**: Only show dates in `custom_dates` array
3. **Enforce Time Restrictions**: Apply weekday time slot limitations
4. **Handle Multi-day Jobs**: Ensure consecutive day selection

### Data Flow

1. **Admin creates quote** → Sets booking restrictions
2. **Customer accepts quote** → Restrictions are displayed
3. **Customer schedules job** → Calendar enforces restrictions
4. **System validates** → Ensures compliance with restrictions

## Configuration Options

### Default Values

- `allowed_days`: 'weekends'
- `job_duration_days`: 1
- `custom_dates`: []

### Business Rules

- **Weekends**: Saturday and Sunday, all day availability
- **Weekdays**: Monday through Friday, 5:30 PM, 6:30 PM, 7:30 PM only
- **Job Duration**: 1-7 consecutive days
- **Custom Dates**: Specific dates with weekend/weekday rules applied

## Testing

Run the test suite to verify functionality:

```bash
node test-booking-restrictions.js
```

This will test:
- Creating quotes with restrictions
- Updating restrictions
- Querying by restriction criteria
- Database operations

## Future Enhancements

1. **Advanced Time Slots**: More flexible time slot configurations
2. **Seasonal Restrictions**: Date range-based restrictions
3. **Capacity Management**: Limit concurrent jobs per day
4. **Customer Preferences**: Allow customers to suggest preferred dates
5. **Automated Scheduling**: AI-powered date suggestions based on restrictions

## Troubleshooting

### Common Issues

1. **Restrictions Not Showing**: Check if quote has `booking_restrictions` field
2. **Calendar Not Filtering**: Verify `window.bookingRestrictions` is set
3. **Custom Dates Not Working**: Ensure dates are in YYYY-MM-DD format

### Debug Information

- Check browser console for restriction loading logs
- Verify database has correct restriction data
- Confirm API endpoints are returning restriction data

## Security Considerations

- Only administrators can set booking restrictions
- Restrictions are enforced on both client and server side
- No customer data is exposed through restriction settings
- All date validations happen server-side

## Performance Notes

- Database indexes added for restriction queries
- Restrictions are loaded once per quote session
- Calendar filtering happens client-side for responsiveness
- Minimal impact on existing quote operations
