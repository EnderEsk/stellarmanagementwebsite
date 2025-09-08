let allBookings = [];
let currentFilter = 'all';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let blockedDates = [];
let selectedDate = null;

// Make variables globally accessible
window.allBookings = allBookings;
window.currentFilter = currentFilter;
window.currentMonth = currentMonth;
window.currentYear = currentYear;
window.blockedDates = blockedDates;
window.selectedDate = selectedDate;

// Customer Management Variables
let allCustomers = [];
let currentCustomerId = null;

// Make customer variables globally accessible
window.allCustomers = allCustomers;
window.currentCustomerId = currentCustomerId;

// Helper function to format date without timezone issues
function formatBookingDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
}

// OAuth Authentication - handled by oauth-auth.js
// The OAuth authentication system is now managed by the OAuthAuth class

// Legacy logout function for compatibility
function logout() {
    if (window.simpleGoogleAuth) {
        window.simpleGoogleAuth.logout();
    } else {
        // Fallback logout
        sessionStorage.removeItem('adminOAuthSession');
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminSession');
        location.reload();
    }
}

// Load admin configuration from server
async function loadAdminConfig() {
    try {
        const response = await fetch('/api/admin-config');
        if (response.ok) {
            const config = await response.json();
            window.ADMIN_CONFIG = config;
        } else {
            console.warn('Failed to load admin config, using defaults');
        }
    } catch (error) {
        console.warn('Error loading admin config:', error);
    }
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Load admin configuration first
    await loadAdminConfig();
    console.log('ADMIN_CONFIG loaded:', window.ADMIN_CONFIG);
    
    // OAuth authentication is handled by simple-google-oauth.js
    // The SimpleGoogleOAuth class will automatically check for existing sessions
    // and show/hide the appropriate UI elements
    
    // Clear form fields on page load if authenticated
    if (window.simpleGoogleAuth && window.simpleGoogleAuth.isUserAuthenticated()) {
        clearFormFields();
        // Load bookings immediately if authenticated
        loadBookings();
        
        // Also load calendar events when authenticated
        if (window.adminCalendarEvents) {
            await window.adminCalendarEvents.loadEventsWhenAuthenticated();
        }
    }
    
    // Initialize calendar events if not already done
    if (window.AdminCalendarEvents && !window.adminCalendarEvents) {
        console.log('🔄 Initializing calendar events immediately...');
        window.adminCalendarEvents = new AdminCalendarEvents();
    }
    
    // Add a fallback to load bookings after a short delay
    // This ensures bookings are loaded even if there are timing issues
    setTimeout(async () => {
        if (window.simpleGoogleAuth && window.simpleGoogleAuth.isUserAuthenticated() && (!allBookings || allBookings.length === 0)) {
            console.log('🔄 Fallback: Loading bookings...');
            loadBookings();
            
            // Also load calendar events when authenticated
            if (window.adminCalendarEvents) {
                await window.adminCalendarEvents.loadEventsWhenAuthenticated();
            }
        }
    }, 2000);
    
    // Initialize calendar events after a delay to ensure all scripts are loaded
    setTimeout(() => {
        if (window.AdminCalendarEvents && !window.adminCalendarEvents) {
            console.log('🔄 Initializing calendar events...');
            window.adminCalendarEvents = new AdminCalendarEvents();
        }
    }, 1000);
});

// Clear cached quote and invoice data
function clearCachedData() {
    currentQuoteData = null;
    currentInvoiceData = null;
    console.log('Cleared cached quote and invoice data');
}

// Clear cached data for a specific booking
function clearCachedDataForBooking(bookingId) {
    if (currentQuoteData && currentQuoteData.bookingId !== bookingId) {
        currentQuoteData = null;
    }
    if (currentInvoiceData && currentInvoiceData.bookingId !== bookingId) {
        currentInvoiceData = null;
    }
    console.log(`Cleared cached data for booking: ${bookingId}`);
}

// Clear form fields
function clearFormFields() {
    // Clear quote form fields
    const quoteFields = [
        'quoteClientName',
        'quoteClientPhone', 
        'quoteClientAddress',
        'quoteClientEmail',
        'quoteDate'
    ];
    
    quoteFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
        }
    });
    
    // Clear invoice form fields
    const invoiceFields = [
        'invoiceClientName',
        'invoiceClientPhone',
        'invoiceClientAddress', 
        'invoiceClientEmail',
        'invoiceDate'
    ];
    
    invoiceFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
        }
    });
    
    // Clear service items containers
    const quoteContainer = document.querySelector('.service-items-container');
    const invoiceContainer = document.getElementById('invoiceServiceItems');
    
    if (quoteContainer) {
        quoteContainer.innerHTML = '';
    }
    
    if (invoiceContainer) {
        invoiceContainer.innerHTML = '';
    }
    
    // Reset tax toggles
    const taxToggle = document.getElementById('taxToggle');
    const invoiceTaxToggle = document.getElementById('invoiceTaxToggle');
    
    if (taxToggle) {
        taxToggle.checked = false;
    }
    
    if (invoiceTaxToggle) {
        invoiceTaxToggle.checked = false;
    }
    
    // Reset total display elements to zero
    const totalElements = [
        'subtotalAmount',
        'taxAmount', 
        'grandTotalAmount',
        'invoiceSubtotalAmount',
        'invoiceTaxAmount',
        'invoiceGrandTotalAmount'
    ];
    
    totalElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = '$0.00';
        }
    });
    
    console.log('Cleared all form fields and reset totals');
}

// Helper function to get admin auth headers
function getAuthHeaders() {
    if (window.simpleGoogleAuth && window.simpleGoogleAuth.isUserAuthenticated()) {
        return window.simpleGoogleAuth.getAuthHeaders();
    }
    return {};
}

// Manual refresh function with visual feedback
async function manualRefreshBookings() {
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        refreshBtn.disabled = true;
        
        try {
            await loadBookings();
            showNotification('Bookings refreshed successfully!', 'success');
        } catch (error) {
            showNotification('Failed to refresh bookings', 'error');
        } finally {
            setTimeout(() => {
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                refreshBtn.disabled = false;
            }, 1000);
        }
    }
}

// Load bookings from API
async function loadBookings() {
    try {
        if (!window.simpleGoogleAuth || !window.simpleGoogleAuth.isUserAuthenticated()) {
            return;
        }
        
        const response = await fetch('/api/bookings', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            allBookings = await response.json();
            clearCachedData();
            updateStatistics();
            renderActiveBookings();
            renderHistory();
            
            if (document.getElementById('calendarView').classList.contains('active')) {
                renderCalendar();
            }
            
            if (document.getElementById('customerView').classList.contains('active')) {
                loadCustomers();
            }
            
        } else if (response.status === 401 || response.status === 403) {
            showNotification('Session expired. Please log in again.', 'error');
            setTimeout(() => logout(), 2000);
        } else {
            showNotification('Failed to load bookings', 'error');
        }
    } catch (error) {
        showNotification('Network error loading bookings', 'error');
    }
}

// Load blocked dates
async function loadBlockedDates() {
    try {
        const response = await fetch('/api/blocked-dates');
        if (response.ok) {
            blockedDates = await response.json();
        } else {
            blockedDates = [];
        }
    } catch (error) {
        console.error('Error loading blocked dates:', error);
        blockedDates = [];
    }
}

// Update statistics
function updateStatistics() {
    const stats = {
        pending: allBookings.filter(b => b.status === 'pending').length,
        confirmed: allBookings.filter(b => b.status === 'confirmed').length,
        pendingBooking: allBookings.filter(b => b.status === 'pending-booking').length,
        completed: allBookings.filter(b => b.status === 'completed').length
    };

    document.getElementById('pendingCount').textContent = stats.pending;
    document.getElementById('confirmedCount').textContent = stats.confirmed;
    document.getElementById('pendingBookingCount').textContent = stats.pendingBooking;
    document.getElementById('completedCount').textContent = stats.completed;
}

// Render active bookings (pending and confirmed)
function renderActiveBookings() {
    const grid = document.getElementById('activeBookingsGrid');
    
    if (!allBookings || allBookings.length === 0) {
        grid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading bookings...</div>';
        return;
    }
    
    let filteredBookings = [];
    if (currentFilter === 'all') {
        filteredBookings = allBookings.filter(booking => 
            booking.status === 'pending' || booking.status === 'confirmed' || 
            booking.status === 'pending-booking' || booking.status === 'completed'
        );
    } else {
        filteredBookings = allBookings.filter(b => b.status === currentFilter);
    }

    if (filteredBookings.length === 0) {
        grid.innerHTML = '<div class="empty-state">No bookings found</div>';
        return;
    }

    grid.innerHTML = filteredBookings.map(booking => {
        const statusClass = `status-${booking.status}`;
        const statusText = booking.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

        let actionButtons = '';
        if (booking.status === 'pending') {
            actionButtons = `
                <button class="action-btn quote" onclick="showQuoteModalWithRetry(${JSON.stringify(booking).replace(/"/g, '&quot;')})"><i class="fas fa-file-invoice-dollar"></i> Quote</button>
                <button class="action-btn confirm" onclick="confirmQuoteAndSendEmail('${booking.booking_id}')"><i class="fas fa-check"></i> Confirm Quote</button>
                <button class="action-btn cancel" onclick="updateBookingStatus('${booking.booking_id}', 'cancelled')"><i class="fas fa-times"></i> Cancel</button>
                <button class="action-btn delete" onclick="deleteBooking('${booking.booking_id}')"><i class="fas fa-trash"></i> Delete</button>
            `;
        } else if (booking.status === 'confirmed') {
            actionButtons = `
                <button class="action-btn quote" onclick="showQuoteModalWithRetry(${JSON.stringify(booking).replace(/"/g, '&quot;')})"><i class="fas fa-file-invoice-dollar"></i> Quote</button>
                <button class="action-btn cancel" onclick="updateBookingStatus('${booking.booking_id}', 'cancelled')"><i class="fas fa-times"></i> Cancel</button>
                <button class="action-btn delete" onclick="deleteBooking('${booking.booking_id}')"><i class="fas fa-trash"></i> Delete</button>
            `;
        } else if (booking.status === 'pending-booking') {
            actionButtons = `
                <button class="action-btn confirm" onclick="confirmBooking('${booking.booking_id}')"><i class="fas fa-check-double"></i> Confirm Booking</button>
                <button class="action-btn quote" onclick="showQuoteModalWithRetry(${JSON.stringify(booking).replace(/"/g, '&quot;')})"><i class="fas fa-file-invoice-dollar"></i> Quote</button>
                <button class="action-btn cancel" onclick="updateBookingStatus('${booking.booking_id}', 'cancelled')"><i class="fas fa-times"></i> Cancel</button>
                <button class="action-btn delete" onclick="deleteBooking('${booking.booking_id}')"><i class="fas fa-trash"></i> Delete</button>
            `;
        } else if (booking.status === 'invoice-ready') {
            actionButtons = `
                <button class="action-btn invoice" onclick="showInvoiceModalFromBooking('${booking.booking_id}')"><i class="fas fa-file-invoice"></i> Invoice</button>
                <button class="action-btn quote" onclick="sendInvoiceFromBooking('${booking.booking_id}')"><i class="fas fa-file-invoice-dollar"></i> Send Invoice</button>
                <button class="action-btn warning" onclick="revertBookingStatus('${booking.booking_id}', 'pending-booking')" title="Revert to Job Booked"><i class="fas fa-undo"></i> Revert</button>
                <button class="action-btn delete" onclick="deleteBooking('${booking.booking_id}')"><i class="fas fa-trash"></i> Delete</button>
            `;
        } else if (booking.status === 'invoice-sent') {
            actionButtons = `
                <button class="action-btn invoice" onclick="showInvoiceModalFromBooking('${booking.booking_id}')"><i class="fas fa-file-invoice"></i> View Invoice</button>
                <button class="action-btn confirm" onclick="markInvoicePaid('${booking.booking_id}')"><i class="fas fa-check"></i> Mark as Paid</button>
                <button class="action-btn warning" onclick="revertBookingStatus('${booking.booking_id}', 'invoice-ready')" title="Revert to Invoice Ready"><i class="fas fa-undo"></i> Revert</button>
                <button class="action-btn delete" onclick="deleteBooking('${booking.booking_id}')"><i class="fas fa-trash"></i> Delete</button>
            `;
        } else if (booking.status === 'completed') {
            actionButtons = `
                <button class="action-btn delete" onclick="deleteBooking('${booking.booking_id}')"><i class="fas fa-trash"></i> Delete</button>
            `;
        }

        return `
            <div class="booking-card" onclick="showBookingDetailsPopup('${booking.booking_id}')">
                <div class="booking-header">
                    <div class="booking-id">${booking.booking_id}</div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="booking-essentials">
                    <div class="essential-row"><i class="fas fa-tools essential-icon"></i><span class="essential-value">${booking.service}</span></div>
                    <div class="essential-row"><i class="fas fa-calendar essential-icon"></i><span class="essential-value">${formatBookingDate(booking.date)}</span></div>
                    <div class="essential-row"><i class="fas fa-user essential-icon"></i><span class="essential-value">${booking.name}</span></div>
                </div>
                <div class="booking-actions" onclick="event.stopPropagation();">
                    ${actionButtons}
                </div>
            </div>
        `;
    }).join('');
}

// Render history (completed and cancelled)
function renderHistory() {
    const container = document.getElementById('historyContainer');
    const historyBookings = allBookings.filter(booking => 
        booking.status === 'completed' || booking.status === 'cancelled'
    ).slice(0, 10);

    if (historyBookings.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="empty-state">No recent activity</td></tr>';
        return;
    }

    container.innerHTML = historyBookings.map(booking => {
        const statusClass = `status-${booking.status}`;
        const statusText = booking.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

        return `
            <tr>
                <td>${booking.booking_id}</td>
                <td>${booking.name}</td>
                <td>${booking.service}</td>
                <td>${formatBookingDate(booking.date)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

// Update booking status
async function updateBookingStatus(bookingId, newStatus) {
    try {
        const response = await fetch(`/api/bookings/${bookingId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            showNotification(`Booking ${newStatus} successfully`, 'success');
            loadBookings();
        } else {
            showNotification('Failed to update booking', 'error');
        }
    } catch (error) {
        showNotification('Network error updating booking', 'error');
    }
}

// Confirm quote and send email to customer
async function confirmQuoteAndSendEmail(bookingId) {
    try {
        const response = await fetch(`/api/bookings/${bookingId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: 'confirmed' })
        });

        if (!response.ok) {
            showNotification('Failed to update booking status', 'error');
            return;
        }

        const booking = allBookings.find(b => b.booking_id === bookingId);
        if (!booking) {
            showNotification('Booking not found', 'error');
            return;
        }

        const emailResponse = await fetch(`/api/bookings/${bookingId}/send-booking-email`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                bookingId: bookingId,
                customerEmail: booking.email,
                customerName: booking.name
            })
        });

        if (emailResponse.ok) {
            showNotification('Quote confirmed and email sent', 'success');
            loadBookings();
        } else {
            showNotification('Booking updated but email failed', 'warning');
            loadBookings();
        }
    } catch (error) {
        showNotification('Network error confirming quote', 'error');
    }
}

// Confirm booking (admin confirms customer's booking request)
async function confirmBooking(bookingId) {
    try {
        const response = await fetch(`/api/bookings/${bookingId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: 'completed' })
        });

        if (!response.ok) {
            showNotification('Failed to confirm booking', 'error');
            return;
        }

        const booking = allBookings.find(b => b.booking_id === bookingId);
        if (!booking) {
            showNotification('Booking not found', 'error');
            return;
        }

        const emailResponse = await fetch(`/api/bookings/${bookingId}/send-confirmation-email`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                bookingId: bookingId,
                customerEmail: booking.email,
                customerName: booking.name
            })
        });

        if (emailResponse.ok) {
            showNotification('Booking confirmed and confirmation email sent', 'success');
            loadBookings();
        } else {
            showNotification('Booking confirmed but email failed', 'warning');
            loadBookings();
        }
    } catch (error) {
        showNotification('Network error confirming booking', 'error');
    }
}

// Delete booking permanently
async function deleteBooking(bookingId) {
    if (!confirm('Are you sure you want to permanently delete this booking?')) {
        return;
    }

    try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (response.ok) {
            showNotification('Booking deleted successfully', 'success');
            loadBookings();
        } else {
            showNotification('Failed to delete booking', 'error');
        }
    } catch (error) {
        showNotification('Network error deleting booking', 'error');
    }
}

// View and filter functionality
document.addEventListener('click', function(e) {
    const sidebarLink = e.target.closest('.sidebar-link');
    const filterTab = e.target.closest('.filter-tab');

    if (sidebarLink) {
        e.preventDefault();
        const view = sidebarLink.dataset.view;

        document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
        sidebarLink.classList.add('active');
        document.querySelectorAll('.view-container').forEach(container => container.classList.remove('active'));
        document.getElementById(view + 'View').classList.add('active');

        if (view === 'calendar') {
            loadBlockedDates().then(() => renderCalendar());
        } else if (view === 'customers') {
            loadCustomers();
        }
    }

    if (filterTab) {
        currentFilter = filterTab.dataset.filter;
        document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
        filterTab.classList.add('active');
        renderActiveBookings();
    }
});

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS for notifications if not already present
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        }
        .notification.show {
            transform: translateX(0);
        }
        .notification.success { background-color: #28a745; }
        .notification.error { background-color: #dc3545; }
        .notification.warning { background-color: #ffc107; color: #212529; }
        .notification.info { background-color: #17a2b8; }
        .notification i {
            margin-right: 8px;
        }
    `;
    document.head.appendChild(style);
}

// Calendar functions
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthDisplay = document.getElementById('calendarMonth');
    
    monthDisplay.textContent = `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;
    
    grid.innerHTML = '';
    
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];
        
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        dayElement.textContent = currentDate.getDate();
        dayElement.dataset.date = dateString;
        
        if (currentDate.getMonth() !== currentMonth) {
            dayElement.style.opacity = '0.3';
        }
        
        const today = new Date();
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        const isBlocked = blockedDates.some(d => d.date === dateString);
        
        if (isBlocked) {
            dayElement.classList.add('blocked');
        } else if (isWeekend) {
            dayElement.classList.add('weekend');
        }
        
        const dayBookings = allBookings.filter(b => b.date === dateString && (b.status === 'confirmed' || b.status === 'pending'));
        if (dayBookings.length > 0) {
            dayElement.classList.add('booked');
        }
        
        dayElement.addEventListener('click', () => handleDayClick(currentDate, dayBookings));
        grid.appendChild(dayElement);
    }
}

function handleDayClick(date, bookings) {
    // Implement modal logic here
    console.log('Clicked on', date, bookings);
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// Modal functions
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function closeBookingModal() { closeModal('bookingDetailsModal'); }
function closeBlockingModal() { closeModal('dateBlockingModal'); }
function closeBookingDetailsPopup() { closeModal('bookingDetailsPopupModal'); }
function closeMoveBookingModal() { closeModal('moveBookingModal'); }
function closeCustomerModal() { closeModal('customerModal'); }
function closeCustomerDetailsModal() { closeModal('customerDetailsModal'); }
function showImageModal(src) { document.getElementById('modalImage').src = src; openModal('imageModal'); }
function closeImageModal() { closeModal('imageModal'); }

// Dummy functions for buttons that might not have a corresponding function yet
// Note: showQuoteModal is now defined in admin.html with full functionality
// Add fallback function in case admin.html functions are not loaded yet
function showQuoteModalWithRetry(booking) {
    console.log('🔄 showQuoteModalWithRetry called from admin.js with booking:', booking);
    
    // Check if the function exists in admin.html
    if (typeof window.showQuoteModalWithRetry === 'function' && window.showQuoteModalWithRetry !== showQuoteModalWithRetry) {
        console.log('✅ Using admin.html version of showQuoteModalWithRetry');
        return window.showQuoteModalWithRetry(booking);
    }
    
    // Fallback: try to open modal directly
    console.log('⚠️ Using fallback modal opening');
    try {
        const modal = document.getElementById('quoteModal');
        if (modal) {
            modal.style.display = 'block';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            modal.classList.add('show');
            document.body.classList.add('modal-open');
            console.log('✅ Quote modal opened via fallback');
        } else {
            console.error('❌ Quote modal not found');
            showNotification('Quote modal not found. Please refresh the page.', 'error');
        }
    } catch (error) {
        console.error('❌ Error in fallback modal opening:', error);
        showNotification('Error opening quote modal', 'error');
    }
}

function showAddCustomerModal() { console.log('showAddCustomerModal'); }
function migrateCustomers() { console.log('migrateCustomers'); }
function recalculateCustomerTotals() { console.log('recalculateCustomerTotals'); }
function refreshCustomerData() { console.log('refreshCustomerData'); }
function searchCustomers() { console.log('searchCustomers'); }
function saveCustomer() { console.log('saveCustomer'); }
function editCustomer() { console.log('editCustomer'); }
function moveBooking() { console.log('moveBooking'); }
function changeMoveMonth(month) { console.log('changeMoveMonth', month); }
function renderMoveCalendar() { console.log('renderMoveCalendar'); }
function toggleDateBlock() { console.log('toggleDateBlock'); }
function unblockDate() { console.log('unblockDate'); }
// showBookingDetailsPopup is defined in admin.html
function loadCustomers() { console.log('loadCustomers'); }

// Invoice functions
async function sendInvoiceFromBooking(bookingId) {
    console.log('sendInvoiceFromBooking called with bookingId:', bookingId);
    
    if (!confirm('Are you sure you want to send an invoice to this customer?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/bookings/${bookingId}/send-invoice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('Invoice sent to customer successfully!', 'success');
            loadBookings(); // Refresh to update status
        } else {
            const error = await response.json();
            showNotification(error.error || 'Failed to send invoice', 'error');
        }
    } catch (error) {
        console.error('Error sending invoice:', error);
        showNotification('Network error sending invoice', 'error');
    }
}

function showInvoiceModalFromBooking(bookingId) {
    console.log('showInvoiceModalFromBooking', bookingId);
    // Store the current booking ID for invoice creation
    window.currentInvoiceBookingId = bookingId;
    
    // Find the booking data
    const booking = allBookings.find(b => b.booking_id === bookingId);
    if (booking) {
        // Populate invoice form with booking data
        document.getElementById('invoiceClientName').value = booking.name || '';
        document.getElementById('invoiceClientName').value = booking.phone || '';
        document.getElementById('invoiceClientName').value = booking.address || '';
        document.getElementById('invoiceClientName').value = booking.email || '';
        document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
        
        // Check if there's a quote for this booking
        loadQuoteForInvoice(bookingId);
    }
    openModal('invoiceModal');
}

// Get current booking ID for invoice creation
function getCurrentBookingId() {
    return window.currentInvoiceBookingId;
}

// Generate invoice
async function generateInvoice() {
    const clientName = document.getElementById('invoiceClientName').value;
    const clientPhone = document.getElementById('invoiceClientPhone').value;
    const clientAddress = document.getElementById('invoiceClientAddress').value;
    const clientEmail = document.getElementById('invoiceClientEmail').value;
    const invoiceDate = document.getElementById('invoiceDate').value;
    
    if (!clientName || !clientPhone || !clientAddress || !clientEmail || !invoiceDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Get service items
    const serviceItems = [];
    const serviceItemElements = document.querySelectorAll('#invoiceServiceItems .service-item');
    
    serviceItemElements.forEach(item => {
        const description = item.querySelector('.item-desc-input').value;
        const quantity = parseFloat(item.querySelector('.item-qty-input').value);
        const price = parseFloat(item.querySelector('.item-price-input').value);
        
        if (description && quantity && price) {
            serviceItems.push({
                description,
                quantity,
                price,
                total: quantity * price
            });
        }
    });
    
    if (serviceItems.length === 0) {
        showNotification('Please add at least one service item', 'error');
        return;
    }
    
    // Calculate totals
    const subtotal = serviceItems.reduce((sum, item) => sum + item.total, 0);
    const taxToggle = document.getElementById('invoiceTaxToggle');
    const taxAmount = taxToggle && taxToggle.checked ? subtotal * 0.05 : 0;
    const grandTotal = subtotal + taxAmount;
    
    // Create invoice data
    const invoiceData = {
        client_name: clientName,
        client_phone: clientPhone,
        client_address: clientAddress,
        client_email: clientEmail,
        invoice_date: invoiceDate,
        service_items: JSON.stringify(serviceItems),
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: grandTotal
    };
    
    try {
        // Get the current booking ID from the modal context
        const currentBookingId = getCurrentBookingId();
        
        if (!currentBookingId) {
            showNotification('No booking context found. Please try again.', 'error');
            return;
        }
        
        // Add booking_id to the invoice data
        invoiceData.booking_id = currentBookingId;
        
        const response = await fetch(`/api/bookings/${currentBookingId}/create-invoice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(invoiceData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('Invoice created successfully!', 'success');
            closeModal('invoiceModal');
            
            // Refresh bookings to show updated status
            loadBookings();
            
            // Show invoice preview
            showInvoicePreview(result.invoice_id);
        } else {
            const error = await response.json();
            showNotification(error.error || 'Failed to create invoice', 'error');
        }
    } catch (error) {
        console.error('Error creating invoice:', error);
        showNotification('Network error creating invoice', 'error');
    }
}

// Show invoice preview
function showInvoicePreview(invoiceId) {
    // This would populate the invoice preview modal
    // For now, just show a success message
    showNotification(`Invoice ${invoiceId} created successfully!`, 'success');
}

// Load quote data for invoice creation
async function loadQuoteForInvoice(bookingId) {
    try {
        const response = await fetch(`/api/quotes/booking/${bookingId}`);
        if (response.ok) {
            const quotes = await response.json();
            if (quotes.length > 0) {
                const quote = quotes[0];
                populateInvoiceFromQuote(quote);
            }
        }
    } catch (error) {
        console.error('Error loading quote for invoice:', error);
    }
}

// Populate invoice form from quote data
function populateInvoiceFromQuote(quote) {
    const serviceItemsContainer = document.getElementById('invoiceServiceItems');
    if (serviceItemsContainer && quote.service_items) {
        serviceItemsContainer.innerHTML = '';
        
        const serviceItems = typeof quote.service_items === 'string' 
            ? JSON.parse(quote.service_items) 
            : quote.service_items;
        
        serviceItems.forEach((item, index) => {
            const itemElement = createServiceItemElement(item, index + 1);
            serviceItemsContainer.appendChild(itemElement);
        });
        
        // Update totals
        updateInvoiceTotals();
    }
}

// Create service item element for invoice
function createServiceItemElement(item, itemId) {
    const div = document.createElement('div');
    div.className = 'service-item';
    div.dataset.itemId = itemId;
    
    div.innerHTML = `
        <div class="item-row">
            <div class="item-description">
                <input type="text" class="item-desc-input" placeholder="Service or item description" value="${item.description || ''}" readonly>
            </div>
            <div class="item-controls">
                <div class="item-quantity">
                    <input type="number" class="item-qty-input" value="${item.quantity || 1}" min="1" placeholder="Qty" readonly>
                </div>
                <div class="item-price">
                    <input type="number" class="item-price-input" value="${item.price || 0}" min="0" step="0.01" placeholder="Price" readonly>
                </div>
                <div class="item-total">
                    <span class="item-total-amount">$${((item.quantity || 1) * (item.price || 0)).toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;
    
    return div;
}

// Update invoice totals - function moved to admin.html to avoid conflicts

// Toggle invoice tax
function toggleInvoiceTax() {
    updateInvoiceTotals();
}

// Mark invoice as paid
async function markInvoicePaid(bookingId) {
    if (!confirm('Are you sure you want to mark this invoice as paid?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/bookings/${bookingId}/mark-paid`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            }
        });
        
        if (response.ok) {
            showNotification('Invoice marked as paid successfully', 'success');
            loadBookings();
        } else {
            const error = await response.json();
            showNotification(error.error || 'Failed to mark invoice as paid', 'error');
        }
    } catch (error) {
        console.error('Error marking invoice as paid:', error);
        showNotification('Network error marking invoice as paid', 'error');
    }
}

// Revert booking status
async function revertBookingStatus(bookingId, newStatus) {
    if (!confirm(`Are you sure you want to revert this booking to '${newStatus}'?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/bookings/${bookingId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            showNotification(`Booking status reverted to '${newStatus}' successfully`, 'success');
            loadBookings();
        } else {
            const error = await response.json();
            showNotification(error.error || 'Failed to revert booking status', 'error');
        }
    } catch (error) {
        console.error('Error reverting booking status:', error);
        showNotification('Network error reverting booking status', 'error');
    }
}

// Debug and utility functions
window.debugQuoteModal = function() {
    console.log('🔍 Debugging quote modal...');
    
    // Check if functions exist
    console.log('showQuoteModalWithRetry exists:', typeof showQuoteModalWithRetry);
    console.log('window.showQuoteModalWithRetry exists:', typeof window.showQuoteModalWithRetry);
    
    // Check if modal exists
    const modal = document.getElementById('quoteModal');
    console.log('Quote modal element:', modal);
    
    if (modal) {
        console.log('Modal properties:', {
            id: modal.id,
            className: modal.className,
            style: modal.style.cssText,
            display: modal.style.display,
            visibility: modal.style.visibility,
            opacity: modal.style.opacity
        });
    }
    
    // Check for any JavaScript errors
    console.log('Current page URL:', window.location.href);
    console.log('Scripts loaded:', Array.from(document.scripts).map(s => s.src || 'inline'));
};

// Test function to open quote modal
window.testQuoteModal = function() {
    console.log('🧪 Testing quote modal...');
    
    const testBooking = {
        booking_id: 'TEST-123',
        service: 'Test Service',
        date: '2025-01-01',
        time: '10:00 AM',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '(555) 123-4567',
        address: '123 Test St',
        notes: 'Test notes'
    };
    
    try {
        showQuoteModalWithRetry(testBooking);
    } catch (error) {
        console.error('❌ Error testing quote modal:', error);
        showNotification('Error testing quote modal: ' + error.message, 'error');
    }
};
