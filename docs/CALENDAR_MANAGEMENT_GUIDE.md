# Calendar Management System - Admin Panel

## 🎯 **New Calendar Management Features**

The admin panel now includes a comprehensive calendar management system that allows you to:
- **View all bookings** on a monthly calendar
- **Block/unblock dates** for personal time off
- **Manage weekend availability** (block/unblock weekends)
- **View detailed booking information** with a single click
- **Color-coded calendar** for easy status identification

## 📅 **Calendar Tab Features:**

### **Visual Calendar Interface:**
- **Monthly view** with navigation controls
- **Color-coded days** for different statuses
- **Click any date** to see details or manage blocking
- **Responsive design** for mobile and desktop

### **Color Coding System:**
- **🟢 Available**: Green - Normal working days with no bookings
- **🔵 Booked**: Blue - Days with confirmed or pending bookings
- **🔴 Blocked**: Red - Manually blocked dates (unavailable)
- **⚫ Weekend**: Gray - Weekend days (default unavailable)
- **🟡 Today**: Yellow highlight for current date

## 🎨 **Calendar Legend:**

### **Available (Green):**
- Normal working days
- No bookings scheduled
- Available for new bookings

### **Booked (Blue):**
- Days with confirmed or pending bookings
- Click to view booking details
- Shows customer information and actions

### **Blocked (Red):**
- Manually blocked dates
- Unavailable for bookings
- Can be unblocked if needed

### **Weekend (Gray):**
- Saturday and Sunday
- Default unavailable
- Can be unblocked for weekend work

## 🖱️ **Click Actions:**

### **Click on Booked Day:**
- **Shows booking details** in a popup modal
- **Customer information**: Name, email, service, notes
- **Booking status**: Pending, Confirmed, Completed, Cancelled
- **Action buttons**: Confirm, Complete, Cancel, Delete
- **Full booking management** from calendar view

### **Click on Available Day:**
- **Shows blocking management** modal
- **Option to block the date** for personal time off
- **Date information** and current status
- **Block/Unblock controls**

### **Click on Blocked/Weekend Day:**
- **Shows blocking management** modal
- **Option to unblock the date** for availability
- **Date information** and current status
- **Block/Unblock controls**

## 🔧 **How to Use:**

### **Accessing the Calendar:**
1. **Login** to admin panel: `http://localhost:3000/admin.html`
2. **Click "Calendar" tab** in the filter tabs
3. **View monthly calendar** with all bookings and blocked dates

### **Navigating the Calendar:**
- **Previous Month**: Click left arrow button
- **Next Month**: Click right arrow button
- **Current month/year** displayed in center
- **Today's date** highlighted in yellow

### **Blocking a Date:**
1. **Click on an available date** (green)
2. **Click "Block Date"** button in the modal
3. **Date becomes red** and unavailable for bookings
4. **Confirmation notification** appears

### **Unblocking a Date:**
1. **Click on a blocked date** (red) or weekend (gray)
2. **Click "Unblock Date"** button in the modal
3. **Date becomes available** for bookings
4. **Confirmation notification** appears

### **Viewing Booking Details:**
1. **Click on a booked date** (blue)
2. **View customer information** in popup modal
3. **Manage booking status** with action buttons
4. **Close modal** when finished

## 🎯 **Business Use Cases:**

### **Personal Time Off:**
- **Block vacation dates** in advance
- **Block sick days** when needed
- **Block personal appointments** or events
- **Prevent accidental bookings** on unavailable days

### **Weekend Work:**
- **Unblock specific weekends** for extra work
- **Block weekends** when you need time off
- **Flexible weekend availability** management
- **Seasonal weekend work** scheduling

### **Booking Management:**
- **Quick overview** of all bookings
- **Fast status updates** from calendar view
- **Customer information** at a glance
- **Efficient booking management** workflow

## 📱 **Mobile Responsiveness:**

### **Touch-Friendly Interface:**
- **Large touch targets** for easy tapping
- **Swipe navigation** between months
- **Responsive modal** popups
- **Mobile-optimized** button sizes

### **Visual Clarity:**
- **Clear color coding** on small screens
- **Readable text** at all sizes
- **Proper spacing** for touch interaction
- **Optimized layout** for mobile devices

## 🔄 **Integration with Booking System:**

### **Automatic Updates:**
- **New bookings** appear immediately on calendar
- **Status changes** reflect in real-time
- **Blocked dates** prevent new bookings
- **Synchronized data** across all views

### **Booking Prevention:**
- **Blocked dates** are unavailable to customers
- **Weekend dates** are unavailable by default
- **Real-time availability** checking
- **Consistent booking rules** across system

## 🎨 **Visual Design:**

### **Calendar Grid:**
- **7-column layout** (Sunday to Saturday)
- **Square day cells** with proper aspect ratio
- **Clear day numbers** and status indicators
- **Hover effects** for interactive feedback

### **Modal Design:**
- **Clean, modern** popup interface
- **Consistent styling** with admin theme
- **Clear action buttons** with icons
- **Responsive layout** for all screen sizes

### **Color Scheme:**
- **Available**: `#28a745` (Green)
- **Booked**: `#17a2b8` (Blue)
- **Blocked**: `#dc3545` (Red)
- **Weekend**: `#6c757d` (Gray)
- **Today**: `#5a5a5a` (Dark Gray)

## 🚀 **Quick Start Guide:**

### **First Time Setup:**
1. **Access admin panel** and login
2. **Click "Calendar" tab** to view calendar
3. **Block any vacation dates** you have planned
4. **Unblock weekends** if you want to work weekends
5. **Review existing bookings** on the calendar

### **Daily Usage:**
1. **Check calendar** for today's bookings
2. **Block dates** when you need time off
3. **Unblock dates** when you become available
4. **Manage bookings** directly from calendar view
5. **Navigate months** to plan ahead

### **Weekly Planning:**
1. **Review next week's** bookings
2. **Block personal time** as needed
3. **Unblock weekends** for extra work if desired
4. **Update booking statuses** as work progresses
5. **Plan ahead** for upcoming weeks

## 🎉 **Benefits:**

### **For Business Management:**
- **Visual overview** of all bookings
- **Easy date blocking** for time off
- **Quick booking management** from calendar
- **Flexible weekend availability** control

### **For Customer Service:**
- **Prevent double bookings** with blocked dates
- **Clear availability** for customers
- **Efficient booking management** workflow
- **Professional scheduling** system

### **For Personal Planning:**
- **Plan vacations** by blocking dates
- **Manage personal time** effectively
- **Flexible weekend work** options
- **Clear work schedule** visualization

---

## 🔧 **Technical Details:**

### **API Endpoints:**
- **GET /api/blocked-dates**: Get all blocked dates
- **POST /api/blocked-dates**: Block a new date
- **DELETE /api/blocked-dates/:date**: Unblock a date

### **Database Tables:**
- **blocked_dates**: Stores manually blocked dates
- **bookings**: Existing booking data (unchanged)

### **Frontend Features:**
- **Real-time calendar** rendering
- **Interactive date** management
- **Modal popups** for details and actions
- **Responsive design** for all devices

The calendar management system provides complete control over your availability and booking schedule, making it easy to manage your tree service business efficiently! 