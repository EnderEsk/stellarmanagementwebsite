# Admin Archive Feature

This document describes the new archive functionality added to the Stellar Tree Management admin panel.

## Overview

The archive feature allows administrators to:
- Archive completed, cancelled, or old bookings
- View archived bookings in a dedicated archive tab
- Unarchive bookings when needed
- Permanently delete archived bookings
- Search and filter archived bookings

## Features

### 1. Archive Tab
- New "Archive" tab in the Management Views section
- Shows count of archived bookings
- Lazy loading - only loads when accessed

### 2. Archive Button
- Added to all booking action menus
- Available in the detailed booking popup
- Archives the booking and moves it to the archive

### 3. Archive View
- Slim list layout (similar to customer management interfaces)
- Search functionality with keyboard shortcut (⌘K)
- Filter options: All Archived, Completed, Cancelled, Old Bookings
- Statistics showing total, completed, and cancelled counts

### 4. Archive Item Actions
- Three-dot menu for each archived booking
- View Details - shows full booking information
- Unarchive - restores booking to active list
- Delete Permanently - removes booking forever

## Files Added

### 1. `admin-archive.js`
- Main archive functionality
- Handles UI interactions
- Manages archive state and data

### 2. `admin-archive.css`
- Styling for archive components
- Matches website theme
- Responsive design

### 3. `test-archive.html`
- Test file to verify functionality
- Tests API endpoints and UI components

## API Endpoints Added

### 1. Archive Booking
```
POST /api/bookings/:bookingId/archive
```
- Archives a booking
- Sets `archived: true`, `archived_at`, `archived_by`
- Requires admin authentication

### 2. Unarchive Booking
```
POST /api/bookings/:bookingId/unarchive
```
- Restores a booking from archive
- Removes archive fields
- Requires admin authentication

### 3. Get Archived Bookings
```
GET /api/bookings/archived
```
- Returns list of all archived bookings
- Sorted by archive date (newest first)
- Requires admin authentication

## Database Changes

### 1. New Fields Added
- `archived`: Boolean flag indicating if booking is archived
- `archived_at`: Date when booking was archived
- `archived_by`: Email of admin who archived the booking

### 2. Modified Queries
- Main bookings endpoint now excludes archived bookings
- Date-specific queries exclude archived bookings
- Availability queries exclude archived bookings

## Usage Instructions

### 1. Accessing the Archive
1. Go to the admin panel
2. Click on the "Archive" tab in the Management Views section
3. The archive view will load with archived bookings

### 2. Archiving a Booking
1. Click on any booking card to open details
2. Click the "Archive" button in the action menu
3. The booking will be moved to the archive

### 3. Viewing Archived Bookings
1. Use the search bar to find specific bookings
2. Use the filter dropdown to view by status
3. Click on any archived booking to see details

### 4. Unarchiving a Booking
1. Click on an archived booking
2. Click "Unarchive" in the details modal
3. The booking will be restored to the active list

### 5. Deleting Archived Bookings
1. Click on an archived booking
2. Click "Delete Permanently" in the details modal
3. Confirm the deletion (cannot be undone)

## Styling and Theme

The archive feature follows the existing website theme:
- Uses CSS variables for consistent colors
- Matches button and input styles
- Responsive design for mobile devices
- Smooth animations and transitions

## Security

- All archive operations require admin authentication
- Archive status is tracked with user information
- Permanent deletion requires confirmation
- API endpoints validate user permissions

## Testing

Use `test-archive.html` to test:
1. Archive functionality
2. Load archived bookings
3. Unarchive functionality
4. UI components

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features
- CSS Grid and Flexbox support
- Responsive design

## Future Enhancements

Potential improvements:
- Bulk archive/unarchive operations
- Archive retention policies
- Export archived data
- Archive analytics and reporting
- Integration with backup systems

## Troubleshooting

### Common Issues

1. **Archive tab not showing**
   - Check if `admin-archive.js` is loaded
   - Verify CSS file is included
   - Check browser console for errors

2. **Archive button not working**
   - Verify admin authentication
   - Check API endpoint availability
   - Ensure booking ID is valid

3. **Archive view not loading**
   - Check network requests
   - Verify database connection
   - Check admin permissions

### Debug Mode

Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## Support

For issues or questions about the archive feature:
1. Check browser console for error messages
2. Verify API endpoints are accessible
3. Test with the provided test file
4. Check database connectivity and permissions
