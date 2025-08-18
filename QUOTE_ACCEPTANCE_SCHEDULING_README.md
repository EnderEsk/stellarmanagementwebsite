# Quote Acceptance and Job Scheduling Flow

## Overview

This document describes the complete flow from quote acceptance to job scheduling and confirmation in the Stellar Tree Management system. The new flow provides customers with a seamless experience to schedule their jobs after accepting quotes.

## Flow Diagram

```
Customer Receives Quote
         ↓
   Customer Accepts Quote
         ↓
   Status: quote-accepted
         ↓
   Quote Acceptance Email Sent
         ↓
   Customer Clicks "Schedule My Job"
         ↓
   Redirected to Schedule Job Page
         ↓
   Customer Selects Date & Time
         ↓
   Customer Confirms Job Booking
         ↓
   Status: pending-booking
         ↓
   Admin Reviews & Confirms Job
         ↓
   Status: invoice-ready
         ↓
   Admin Creates & Sends Invoice
         ↓
   Status: invoice-sent
         ↓
   Customer Pays Invoice
         ↓
   Status: completed
```

## Components

### 1. Quote Acceptance Email Template
- **File**: `templates/improved-quote-acceptance-template.js`
- **Purpose**: Sent when customer accepts a quote
- **Features**: 
  - Professional design with company branding
  - Clear call-to-action to schedule job
  - Direct link to scheduling page
  - Quote summary and next steps

### 2. Job Scheduling Page
- **File**: `schedule-job.html`
- **Purpose**: Interactive calendar for customers to select job date and time
- **Features**:
  - Interactive calendar with availability indicators
  - Time slot selection (5:30 PM, 6:30 PM, 7:30 PM)
  - Real-time availability checking
  - Mobile-responsive design
  - Form validation and confirmation

### 3. Updated Server Endpoints
- **Quote Acceptance**: `POST /api/bookings/:bookingId/accept-quote`
- **Job Scheduling**: `POST /api/bookings/:bookingId/book-job`
- **Job Confirmation**: `PATCH /api/bookings/:bookingId/status`

### 4. Enhanced Email Service
- **File**: `email-service.js`
- **New Method**: `sendQuoteAcceptanceEmail()`
- **Purpose**: Sends quote acceptance email with scheduling link

## Implementation Details

### Quote Acceptance Flow

1. **Customer Action**: Customer clicks "Accept Quote" on booking status page
2. **API Call**: `POST /api/bookings/:bookingId/accept-quote`
3. **Status Update**: Booking status changes to `quote-accepted`
4. **Email Sent**: Quote acceptance email sent to customer
5. **UI Update**: Booking status page shows "Schedule My Job" button

### Job Scheduling Flow

1. **Customer Action**: Customer clicks "Schedule My Job" button
2. **Page Redirect**: Customer redirected to `schedule-job.html?booking_id=XXX`
3. **Calendar Display**: Interactive calendar shows available dates
4. **Date Selection**: Customer selects preferred date
5. **Time Selection**: Customer selects preferred time slot
6. **Form Confirmation**: Customer reviews and confirms booking details
7. **API Call**: `POST /api/bookings/:bookingId/book-job`
8. **Status Update**: Booking status changes to `pending-booking`

### Admin Confirmation Flow

1. **Admin Review**: Admin sees booking in "pending-booking" status
2. **Job Confirmation**: Admin clicks "Confirm Job" button
3. **Status Update**: Booking status changes to `invoice-ready`
4. **Invoice Creation**: Admin creates and sends invoice
5. **Payment Processing**: Customer pays invoice
6. **Completion**: Booking status changes to `completed`

## API Endpoints

### Accept Quote
```http
POST /api/bookings/:bookingId/accept-quote
```
**Response**: 
```json
{
  "message": "Quote accepted successfully",
  "status": "quote-accepted"
}
```

### Schedule Job
```http
POST /api/bookings/:bookingId/book-job
```
**Request Body**:
```json
{
  "jobDate": "2024-12-20",
  "jobTime": "6:30 PM",
  "additionalNotes": "Optional additional notes"
}
```
**Response**:
```json
{
  "message": "Job booking submitted successfully",
  "jobDate": "2024-12-20",
  "jobTime": "6:30 PM"
}
```

### Update Booking Status
```http
PATCH /api/bookings/:bookingId/status
```
**Request Body**:
```json
{
  "status": "invoice-ready"
}
```

## Database Schema Updates

### Bookings Collection
- **`job_date`**: Date when the job is scheduled (YYYY-MM-DD)
- **`job_time`**: Time when the job is scheduled (e.g., "6:30 PM")
- **`status`**: Current booking status
  - `quote-accepted`: Customer accepted quote, ready to schedule
  - `pending-booking`: Job scheduled, awaiting admin confirmation
  - `invoice-ready`: Job confirmed, ready for invoice

## Email Templates

### Quote Acceptance Email
- **Subject**: "Quote Accepted - {bookingId} - Schedule Your Job Now!"
- **Content**: 
  - Quote acceptance confirmation
  - Quote summary
  - Direct link to scheduling page
  - Clear call-to-action

### Email Flow
1. **Quote Request**: `sendQuoteEmail()` - Initial quote request
2. **Quote Ready**: `sendQuoteConfirmationEmail()` - Quote ready for review
3. **Quote Accepted**: `sendQuoteAcceptanceEmail()` - **NEW** - Quote accepted, schedule job
4. **Job Confirmed**: `sendBookingFinalConfirmationEmail()` - Job confirmed
5. **Invoice Sent**: `sendInvoiceEmail()` - Invoice sent for payment

## User Experience

### Customer Journey
1. **Quote Review**: Customer reviews detailed quote
2. **Quote Acceptance**: Customer accepts quote with one click
3. **Immediate Feedback**: Success message and email confirmation
4. **Easy Scheduling**: Direct link to scheduling page
5. **Interactive Calendar**: Visual date and time selection
6. **Confirmation**: Review and confirm booking details
7. **Status Tracking**: Monitor booking progress

### Admin Workflow
1. **Quote Management**: Create and send quotes
2. **Acceptance Monitoring**: Track quote acceptance rates
3. **Job Scheduling Review**: Review customer-scheduled jobs
4. **Job Confirmation**: Confirm scheduled jobs
5. **Invoice Creation**: Generate invoices for confirmed jobs
6. **Payment Tracking**: Monitor invoice payments

## Business Rules

### Scheduling Constraints
- **Working Days**: Monday to Friday only
- **Time Slots**: 5:30 PM, 6:30 PM, 7:30 PM
- **Availability**: Maximum 1 booking per time slot
- **Advance Booking**: Up to 3 months in advance
- **Weekend Restrictions**: Weekends blocked by default

### Status Progression
- **Quote Flow**: `pending` → `quote-ready` → `quote-sent` → `quote-accepted`
- **Scheduling Flow**: `quote-accepted` → `pending-booking` → `invoice-ready`
- **Completion Flow**: `invoice-ready` → `invoice-sent` → `completed`

## Testing

### Test Script
- **File**: `test-quote-acceptance-flow.js`
- **Purpose**: Test complete flow from quote acceptance to job confirmation
- **Usage**: Run in browser console or Node.js environment

### Test Scenarios
1. **Quote Acceptance**: Verify status update and email sending
2. **Job Scheduling**: Test calendar interaction and form submission
3. **Admin Confirmation**: Verify status progression
4. **Error Handling**: Test invalid inputs and edge cases

## Deployment

### Files to Deploy
1. `templates/improved-quote-acceptance-template.js`
2. `schedule-job.html`
3. `email-service.js` (updated)
4. `server.js` (updated)
5. `booking-status.html` (updated)

### Environment Variables
- `BASE_URL`: Base URL for email links (e.g., https://stellartreemanagement.ca)
- `RESEND_API_KEY`: Email service API key
- `RESEND_FROM_EMAIL`: Sender email address

## Monitoring and Analytics

### Key Metrics
- **Quote Acceptance Rate**: Percentage of quotes accepted
- **Scheduling Completion Rate**: Percentage of accepted quotes that get scheduled
- **Time to Schedule**: Average time from quote acceptance to job scheduling
- **Admin Confirmation Time**: Average time from scheduling to admin confirmation

### Logging
- Quote acceptance events
- Job scheduling submissions
- Admin confirmations
- Email delivery status

## Future Enhancements

### Potential Improvements
1. **SMS Notifications**: Text message reminders for scheduled jobs
2. **Calendar Integration**: Sync with popular calendar applications
3. **Automated Reminders**: Pre-job reminder emails
4. **Rescheduling**: Allow customers to reschedule jobs
5. **Payment Integration**: Online payment processing
6. **Customer Portal**: Dedicated customer dashboard

### Technical Improvements
1. **Real-time Updates**: WebSocket notifications for status changes
2. **Mobile App**: Native mobile application
3. **API Rate Limiting**: Protect against abuse
4. **Caching**: Improve performance with Redis
5. **Analytics Dashboard**: Real-time business metrics

## Support and Troubleshooting

### Common Issues
1. **Email Not Sending**: Check Resend API key and configuration
2. **Calendar Not Loading**: Verify availability API endpoint
3. **Status Not Updating**: Check database connection and permissions
4. **Mobile Display Issues**: Test responsive design on various devices

### Debug Tools
- Browser developer console
- Server logs
- Email delivery reports
- API response monitoring

## Conclusion

The new quote acceptance and job scheduling flow provides a seamless customer experience while maintaining administrative control. The system automates many manual processes while ensuring quality control through admin review steps. This implementation significantly improves customer satisfaction and operational efficiency.

For questions or support, contact the development team or refer to the system documentation.



