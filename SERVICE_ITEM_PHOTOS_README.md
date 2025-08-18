# Service Item Photo Management

This feature allows administrators to add, view, and manage photos for individual service items in quotes and invoices. Photos are stored in the MongoDB database and can be included in email communications.

## Features

- **Photo Upload**: Add multiple photos (up to 5) per service item
- **Photo Display**: View photos in a grid layout below each service item
- **Photo Management**: Delete individual photos as needed
- **Photo Modal**: Click photos to view them in full size
- **Email Integration**: Photos are automatically included in quote and invoice emails
- **Database Storage**: Photos are stored in MongoDB with proper metadata

## How It Works

### 1. Photo Storage
- Photos are stored in the `images` collection in MongoDB
- Each photo includes metadata: `quoteId`, `itemId`, `itemIndex`, filename, content type, size, and upload date
- Photos are served via the `/uploads/:imageId` endpoint

### 2. Service Item Integration
- Each service item in quotes and invoices now has a photo section
- Photos are organized by service item ID and index
- The system maintains the relationship between photos and service items

### 3. Email Integration
- Photos are automatically included in quote and invoice emails
- Photos appear below the service description in a grid layout
- Email templates have been updated to support photo display

## API Endpoints

### Upload Photos
```
POST /api/service-item-photos/:quoteId/:itemId
```
- **Parameters**: 
  - `quoteId`: The ID of the quote
  - `itemId`: The ID of the service item
- **Body**: FormData with `photos` (array of files) and `itemIndex`
- **Response**: Success message and array of image paths

### Get Photos
```
GET /api/service-item-photos/:quoteId/:itemId
```
- **Parameters**: 
  - `quoteId`: The ID of the quote
  - `itemId`: The ID of the service item
- **Response**: Array of photo paths for the service item

### Delete Photo
```
DELETE /api/service-item-photos/:quoteId/:itemId/:imageId
```
- **Parameters**: 
  - `quoteId`: The ID of the quote
  - `itemId`: The ID of the service item
  - `imageId`: The ID of the photo to delete
- **Response**: Success message

## Database Schema

### Images Collection
```javascript
{
  _id: ObjectId,
  quoteId: String,           // Quote ID
  itemId: String,            // Service item ID
  itemIndex: Number,         // Position in service items list
  filename: String,          // Original filename
  contentType: String,       // MIME type
  size: Number,              // File size in bytes
  data: Binary,              // Image data
  uploadedAt: Date,          // Upload timestamp
  type: String               // 'service-item-photo'
}
```

### Quotes Collection
```javascript
{
  // ... existing fields ...
  serviceItemPhotos: {
    "1": ["/uploads/imageId1", "/uploads/imageId2"],  // Photos for item 1
    "2": ["/uploads/imageId3"],                      // Photos for item 2
    // ... more items
  }
}
```

## Usage in Admin Panel

### Adding Photos
1. Open a quote or invoice in the admin panel
2. In any service item, click the "📷 Add Photo" button
3. Select one or more image files (JPG, PNG, GIF, WebP)
4. Photos will be uploaded and displayed below the service item

### Viewing Photos
- Photos are displayed in a grid below each service item
- Click on any photo to view it in full size in a modal
- Photos are automatically loaded when opening existing quotes/invoices

### Managing Photos
- Each photo has a delete button (🗑️) in the top-right corner
- Click to remove individual photos
- Photos are permanently deleted from both the database and display

## Email Templates

### Quote Emails
- Photos appear below the service description
- Styled with orange accent color (`#fd7e14`)
- Grid layout with 60x60px thumbnails

### Invoice Emails
- Photos appear below the service description
- Styled with red accent color (`#dc3545`)
- Same grid layout as quotes

## File Types Supported
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## File Size Limits
- Maximum file size: 10MB per photo
- Maximum photos per service item: 5
- Total upload limit per request: 50MB

## Security Features
- File type validation (images only)
- File size limits
- Admin authentication required for uploads
- Proper error handling and validation

## Testing

Use the `test-service-item-photos.html` file to test the photo functionality:

1. Open the test file in a browser
2. Click "Add Photo" on any service item
3. Select image files to upload
4. Verify photos are displayed and can be deleted
5. Check browser console for API responses

## Browser Compatibility
- Modern browsers with ES6+ support
- File API support required
- FormData support required

## Mobile Responsiveness
- Photo grid adapts to screen size
- Touch-friendly interface
- Responsive photo sizing

## Future Enhancements
- Photo editing/cropping
- Bulk photo operations
- Photo categories/tags
- Photo search and filtering
- Photo compression/optimization
- Cloud storage integration

## Troubleshooting

### Common Issues

1. **Photos not uploading**
   - Check file size (max 10MB)
   - Verify file type is supported
   - Check admin authentication

2. **Photos not displaying**
   - Verify MongoDB connection
   - Check image serving endpoint
   - Clear browser cache

3. **Photo deletion fails**
   - Check admin permissions
   - Verify quote and item IDs
   - Check database connection

### Debug Information
- Check browser console for error messages
- Verify API endpoint responses
- Check server logs for upload errors
- Verify database indexes are created

## Dependencies
- MongoDB with GridFS support
- Multer for file uploads
- Express.js for API endpoints
- Modern browser with File API support

## Performance Considerations
- Photos are served with caching headers
- Database indexes on quoteId and itemId
- Efficient photo loading per service item
- Optimized image serving from MongoDB


