# Calendar Events Feature

## Overview

The Calendar Events feature allows administrators to create and manage non-booking events on the admin calendar. This is useful for scheduling personal tasks, mechanical work, maintenance, meetings, and other activities that don't go through the normal booking process.

## Features

- **Add Events**: Click on any calendar day to open a day management modal with an "Add Event" button
- **Event Types**: Support for various event types (mechanical work, maintenance, personal tasks, meetings, training, etc.)
- **Time Options**: Choose from specific times (9:00 AM - 8:00 PM) or "All Day" events
- **Color Coding**: Each event can have a custom color for easy identification
- **Event Management**: View, edit, and delete events directly from the calendar
- **Visual Indicators**: Small colored dots appear on calendar days with events
- **Mobile Responsive**: Works on both desktop and mobile devices

## How to Use

### 1. Accessing the Feature

1. Navigate to the Admin Panel (`/admin`)
2. Click on the "Calendar View" tab
3. Click on any calendar day to open the day management modal

### 2. Adding an Event

1. Click on a calendar day
2. In the day management modal, click the "Add Event" button
3. Fill in the event details:
   - **Title**: A descriptive name for the event
   - **Type**: Select from predefined categories
   - **Date**: The event date (pre-filled with the selected day)
   - **Time**: Choose a specific time or "All Day"
   - **Description**: Optional additional details
   - **Color**: Choose a color for the event
4. Click "Save Event"

### 3. Managing Events

- **View Events**: Events are displayed in the day management modal
- **Edit Events**: Click on an event to edit its details (future enhancement)
- **Delete Events**: Use the delete button (trash icon) to remove events
- **Event Indicators**: Small colored dots appear on calendar days with events

## Technical Implementation

### Files Added/Modified

- **`admin-calendar-events.js`**: Main calendar events management system
- **`admin-calendar.js`**: Updated to integrate with events system
- **`admin.css`**: Added styles for events and day management modal
- **`admin.html`**: Added script reference for events system
- **`server.js`**: Added API endpoints for calendar events

### API Endpoints

- `GET /api/calendar-events` - Retrieve all calendar events
- `POST /api/calendar-events` - Create a new calendar event
- `PUT /api/calendar-events/:eventId` - Update an existing event
- `DELETE /api/calendar-events/:eventId` - Delete an event

### Database Collection

Events are stored in the `calendar_events` collection with the following structure:

```json
{
  "_id": "ObjectId",
  "title": "Event Title",
  "type": "mechanical",
  "date": "2025-01-15",
  "time": "9:00 AM",
  "description": "Optional description",
  "color": "#007bff",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-15T10:00:00.000Z"
}
```

## Event Types

- **mechanical**: Mechanical work or repairs
- **maintenance**: General maintenance tasks
- **personal**: Personal tasks or appointments
- **meeting**: Business meetings or appointments
- **training**: Training sessions or learning activities
- **other**: Miscellaneous events

## Color Options

- Blue (Default): #007bff
- Green: #28a745
- Yellow: #ffc107
- Red: #dc3545
- Purple: #6f42c1
- Orange: #fd7e14
- Teal: #20c997
- Gray: #6c757d

## Integration with Existing System

- **Non-Interfering**: Events don't affect booking availability or calendar blocking
- **Separate Storage**: Events are stored separately from bookings
- **Admin Only**: Only authenticated administrators can manage events
- **Calendar Integration**: Events appear alongside existing calendar functionality

## Testing

Use the test file `test-calendar-events.html` to verify the functionality:

1. Open `test-calendar-events.html` in your browser
2. Click "Add Event" to test event creation
3. Click "Load Events" to test the API endpoints
4. Test event deletion functionality

## Future Enhancements

- **Event Editing**: In-place editing of event details
- **Recurring Events**: Support for daily, weekly, or monthly recurring events
- **Event Categories**: More detailed categorization and filtering
- **Event Sharing**: Share events with team members
- **Calendar Export**: Export events to external calendar applications
- **Event Reminders**: Email or push notifications for upcoming events

## Troubleshooting

### Common Issues

1. **Events not appearing**: Check browser console for JavaScript errors
2. **API errors**: Verify server is running and database connection is active
3. **Modal not opening**: Ensure all required scripts are loaded
4. **Events not saving**: Check authentication status and API permissions

### Debug Information

- Check browser console for JavaScript errors
- Verify network requests in browser developer tools
- Check server logs for API endpoint errors
- Ensure MongoDB collection `calendar_events` exists

## Security Considerations

- **Authentication Required**: All event operations require admin authentication
- **Input Validation**: Server-side validation of all event data
- **SQL Injection Protection**: Uses parameterized queries via MongoDB
- **XSS Protection**: Input sanitization and output encoding

## Performance Notes

- Events are loaded once per session and cached
- Calendar rendering includes event indicators without additional API calls
- Database queries are optimized with proper indexing
- Mobile performance optimized with responsive design
