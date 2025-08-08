let allBookings = [];
let currentFilter = 'all';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let blockedDates = [];
let selectedDate = null;

// Customer Management Variables
let allCustomers = [];
let currentCustomerId = null;

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
    
    // OAuth authentication is handled by simple-google-oauth.js
    // The SimpleGoogleOAuth class will automatically check for existing sessions
    // and show/hide the appropriate UI elements
    
    // Clear form fields on page load if authenticated
    if (window.simpleGoogleAuth && window.simpleGoogleAuth.isUserAuthenticated()) {
        clearFormFields();
        // Load bookings immediately if authenticated
        loadBookings();
    }
    
    // Add a fallback to load bookings after a short delay
    // This ensures bookings are loaded even if there are timing issues
    setTimeout(() => {
        if (window.simpleGoogleAuth && window.simpleGoogleAuth.isUserAuthenticated() && (!allBookings || allBookings.length === 0)) {
            console.log('🔄 Fallback: Loading bookings...');
            loadBookings();
        }
    }, 2000);
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
                <button class="action-btn quote" onclick="showQuoteModal(${JSON.stringify(booking).replace(/"/g, '&quot;')})"><i class="fas fa-file-invoice-dollar"></i> Quote</button>
                <button class="action-btn confirm" onclick="confirmQuoteAndSendEmail('${booking.booking_id}')"><i class="fas fa-check"></i> Confirm Quote</button>
                <button class="action-btn cancel" onclick="updateBookingStatus('${booking.booking_id}', 'cancelled')"><i class="fas fa-times"></i> Cancel</button>
                <button class="action-btn delete" onclick="deleteBooking('${booking.booking_id}')"><i class="fas fa-trash"></i> Delete</button>
            `;
        } else if (booking.status === 'confirmed') {
            actionButtons = `
                <button class="action-btn quote" onclick="showQuoteModal(${JSON.stringify(booking).replace(/"/g, '&quot;')})"><i class="fas fa-file-invoice-dollar"></i> Quote</button>
                <button class="action-btn cancel" onclick="updateBookingStatus('${booking.booking_id}', 'cancelled')"><i class="fas fa-times"></i> Cancel</button>
                <button class="action-btn delete" onclick="deleteBooking('${booking.booking_id}')"><i class="fas fa-trash"></i> Delete</button>
            `;
        } else if (booking.status === 'pending-booking') {
            actionButtons = `
                <button class="action-btn confirm" onclick="confirmBooking('${booking.booking_id}')"><i class="fas fa-check-double"></i> Confirm Booking</button>
                <button class="action-btn quote" onclick="showQuoteModal(${JSON.stringify(booking).replace(/"/g, '&quot;')})"><i class="fas fa-file-invoice-dollar"></i> Quote</button>
                <button class="action-btn cancel" onclick="updateBookingStatus('${booking.booking_id}', 'cancelled')"><i class="fas fa-times"></i> Cancel</button>
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
    notification.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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
function showQuoteModal(booking) { console.log('showQuoteModal', booking); }
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
function showBookingDetailsPopup(bookingId) { console.log('showBookingDetailsPopup', bookingId); }
function loadCustomers() { console.log('loadCustomers'); }
