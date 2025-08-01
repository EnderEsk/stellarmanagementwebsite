# Booking System Testing Guide - Stellar Tree Management

## 🚀 **How to Test the Booking System**

### **Prerequisites:**
- Server running on `http://localhost:3000`
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled

## 📋 **Step-by-Step Testing Process**

### **1. Start the Server**
```bash
npm start
```
You should see: `Booking server running on port 3000`

### **2. Access the Booking System**

#### **Option A: Through Main Website**
1. Go to: `http://localhost:3000`
2. Click the **"Book Appointment"** button in the hero section
3. Or click **"Book Now"** in the navigation menu

#### **Option B: Direct Access**
1. Go directly to: `http://localhost:3000/booking/`

### **3. Complete a Test Booking**

#### **Step 1: Select Service**
- Choose one of the available services:
  - Tree Removal
  - Trimming & Pruning
  - Stump Grinding
  - Emergency Service
- Click **"Continue"**

#### **Step 2: Select Date**
- Use the calendar to select a future date
- Available dates are highlighted (Monday-Saturday)
- Past dates and Sundays are disabled
- Click **"Continue"**

#### **Step 3: Select Time**
- Choose an available time slot (9 AM - 5 PM)
- Booked slots will show as disabled
- Click **"Continue"**

#### **Step 4: Contact Information**
- **Name**: Enter your full name
- **Email**: Enter a valid email address
- **Notes**: Optional - add any special requirements
- Click **"Book Appointment"**

#### **Step 5: Confirm Booking**
- Review the booking summary
- Click **"Confirm Booking"**
- You should see a success message with booking ID

## 🧪 **Test Scenarios**

### **Scenario 1: Complete Booking Flow**
```
Service: Tree Removal
Date: Tomorrow (if available)
Time: 10:00 AM
Name: Test User
Email: test@example.com
Notes: Test booking for system verification
```

### **Scenario 2: Different Service**
```
Service: Trimming & Pruning
Date: Next week
Time: 2:00 PM
Name: Jane Doe
Email: jane@example.com
Notes: Regular maintenance needed
```

### **Scenario 3: Emergency Service**
```
Service: Emergency Service
Date: Today (if available)
Time: 9:00 AM
Name: Emergency Contact
Email: emergency@example.com
Notes: Storm damage - urgent attention required
```

## 🔍 **What to Test**

### **✅ Form Validation**
- Try submitting without selecting a service
- Try submitting without selecting a date
- Try submitting without selecting a time
- Try submitting with invalid email format
- Try submitting without entering name

### **✅ Calendar Functionality**
- Navigate between months
- Select different dates
- Verify working days (Monday-Saturday)
- Verify disabled days (Sunday, past dates)

### **✅ Time Slot Availability**
- Check if time slots are available
- Try booking the same time slot twice
- Verify booked slots show as disabled

### **✅ Responsive Design**
- Test on desktop browser
- Test on mobile device or browser dev tools
- Test different screen sizes

### **✅ Error Handling**
- Try booking with network disconnected
- Try booking with invalid data
- Verify error messages are clear

## 🛠 **Troubleshooting Common Issues**

### **Issue: "Booking failed. Please try again."**
**Solution:**
1. Check if server is running: `npm start`
2. Check browser console for errors (F12)
3. Verify all required fields are filled
4. Try a different time slot

### **Issue: Calendar not showing**
**Solution:**
1. Refresh the page
2. Check if JavaScript is enabled
3. Clear browser cache
4. Try a different browser

### **Issue: Time slots not loading**
**Solution:**
1. Check if date is selected
2. Verify date is not in the past
3. Check if date is a working day
4. Refresh the page

### **Issue: Form not submitting**
**Solution:**
1. Check all required fields are filled
2. Verify email format is correct
3. Check browser console for errors
4. Try refreshing the page

## 📊 **Admin Panel Testing**

### **Access Admin Panel**
1. Go to: `http://localhost:3000/admin.html`
2. Enter password: `stellar2024`
3. Click "Access Dashboard"

### **Test Admin Functions**
1. **View Statistics** - Check booking counts
2. **View Bookings** - See all bookings in table
3. **Update Status** - Change booking status
4. **Refresh Data** - Update booking list

### **Test Booking Status Changes**
1. Find a test booking in the admin panel
2. Click **"Confirm"** to change status to confirmed
3. Click **"Complete"** to mark as completed
4. Click **"Cancel"** to cancel booking

## 🔧 **API Testing (Advanced)**

### **Test API Endpoints Directly**

#### **Get All Bookings**
```bash
curl http://localhost:3000/api/bookings
```

#### **Create Test Booking**
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "ST-TEST123",
    "service": "Tree Removal",
    "date": "2024-12-25",
    "time": "11:00",
    "name": "API Test User",
    "email": "api@test.com",
    "notes": "API test booking"
  }'
```

#### **Get Booking Statistics**
```bash
curl http://localhost:3000/api/bookings/stats/overview
```

#### **Update Booking Status**
```bash
curl -X PATCH http://localhost:3000/api/bookings/ST-TEST123/status \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

## 📱 **Mobile Testing**

### **Test on Mobile Devices**
1. **iPhone/Safari**: Use Safari browser
2. **Android/Chrome**: Use Chrome browser
3. **Tablet**: Test on iPad or Android tablet

### **Test Responsive Features**
- Touch-friendly buttons
- Swipe navigation
- Mobile-optimized forms
- Proper text sizing

## 🎯 **Success Criteria**

### **✅ Booking Flow Works**
- Can complete full booking process
- Receives confirmation with booking ID
- Booking appears in admin panel

### **✅ Validation Works**
- Form validates required fields
- Shows clear error messages
- Prevents invalid submissions

### **✅ Admin Panel Works**
- Can access with password
- Can view all bookings
- Can update booking status
- Can refresh data

### **✅ Responsive Design**
- Works on desktop
- Works on mobile
- Works on tablet

## 🚨 **Common Test Data**

### **Test Users**
```
Name: John Smith
Email: john@example.com

Name: Jane Doe
Email: jane@example.com

Name: Test User
Email: test@example.com
```

### **Test Services**
- Tree Removal
- Trimming & Pruning
- Stump Grinding
- Emergency Service

### **Test Dates**
- Today (if available)
- Tomorrow
- Next week
- Next month

## 📞 **Getting Help**

### **If Testing Fails:**
1. Check server logs for errors
2. Check browser console (F12)
3. Verify all files are in correct locations
4. Restart the server: `npm start`

### **For Technical Support:**
- Review error messages carefully
- Check if all dependencies are installed
- Verify database is working
- Test API endpoints directly

---

**Happy Testing!** 🎉
The booking system should now work smoothly for both customers and administrators. 