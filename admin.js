let allBookings = [];
let currentFilter = 'all';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let blockedDates = [];
let selectedDate = null;

// Customer Management Variables - REMOVED

// Helper function to format date without timezone issues
function formatBookingDate(dateString) {
    // Handle null, undefined, or empty date strings
    if (!dateString || typeof dateString !== 'string') {
        return 'Invalid Date';
    }
    
    // Check if the date string is in the expected format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
        return 'Invalid Date';
    }
    
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Validate the parsed numbers
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return 'Invalid Date';
    }
    
    const date = new Date(year, month - 1, day);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    
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
    // Wait for OAuth script to be ready
    const waitForOAuth = () => {
        if (window.simpleGoogleAuth) {
            console.log('OAuth script ready, proceeding with initialization');
            initializeAdmin();
        } else {
            console.log('Waiting for OAuth script...');
            setTimeout(waitForOAuth, 100);
        }
    };
    
    waitForOAuth();
});

// Initialize admin functionality once OAuth is ready
async function initializeAdmin() {
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
    }
    
    // Add a fallback to load bookings after a short delay
    // This ensures bookings are loaded even if there are timing issues
    setTimeout(() => {
        if (window.simpleGoogleAuth && window.simpleGoogleAuth.isUserAuthenticated() && (!allBookings || allBookings.length === 0)) {
            console.log('🔄 Fallback: Loading bookings...');
            loadBookings();
        }
    }, 2000);
}

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
            
            // Wait for calendar events to be loaded before rendering calendar
            if (document.getElementById('calendarView').classList.contains('active')) {
                await waitForCalendarEvents();
                await renderCalendar();
            }
            
            // Customer management view - REMOVED
            
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

// Wait for calendar events to be loaded
async function waitForCalendarEvents() {
    // Wait for AdminCalendarEvents to be initialized
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    while (!window.adminCalendarEvents && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (window.adminCalendarEvents) {
        // Wait for events to be loaded
        await window.adminCalendarEvents.loadEvents();
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
        pendingSiteVisit: allBookings.filter(b => b.status === 'pending-site-visit').length,
        quoteReady: allBookings.filter(b => b.status === 'quote-ready').length,
        confirmed: allBookings.filter(b => b.status === 'confirmed').length,
        pendingBooking: allBookings.filter(b => b.status === 'pending-booking').length,
        completed: allBookings.filter(b => b.status === 'completed').length
    };

    document.getElementById('pendingCount').textContent = stats.pending;
    if (document.getElementById('pendingSiteVisitCount')) {
        document.getElementById('pendingSiteVisitCount').textContent = stats.pendingSiteVisit;
    }
    if (document.getElementById('quoteReadyCount')) {
        document.getElementById('quoteReadyCount').textContent = stats.quoteReady;
    }
    document.getElementById('confirmedCount').textContent = stats.confirmed;
    document.getElementById('pendingBookingCount').textContent = stats.pendingBooking;
    document.getElementById('completedCount').textContent = stats.completed;
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
        }
        // Customer management view - REMOVED
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

// Calendar functions - Use the mobile calendar from admin-calendar.js
async function renderCalendar() {
    // Use the mobile calendar function from admin-calendar.js
    if (window.adminCalendar && window.adminCalendar.renderCalendar) {
        await window.adminCalendar.renderCalendar(allBookings);
    } else {
        console.warn('Admin calendar not available, falling back to basic calendar');
        // Fallback to basic calendar if mobile calendar is not available
        const grid = document.getElementById('calendarGrid');
        const monthDisplay = document.getElementById('calendarMonth');
        
        if (monthDisplay) {
            monthDisplay.textContent = `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;
        }
        
        if (grid) {
            grid.innerHTML = '<div class="calendar-loading">Loading calendar...</div>';
        }
    }
}

function handleDayClick(date, bookings) {
    // Use the mobile calendar day click handler
    if (window.adminCalendar && window.adminCalendar.handleDayClick) {
        window.adminCalendar.handleDayClick(date, bookings);
    } else {
        console.warn('Admin calendar day click handler not available');
    }
}

function previousMonth() {
    // Use the mobile calendar month navigation
    if (window.adminCalendar && window.adminCalendar.previousMonth) {
        window.adminCalendar.previousMonth();
    } else {
        // Fallback
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    }
}

function nextMonth() {
    // Use the mobile calendar month navigation
    if (window.adminCalendar && window.adminCalendar.nextMonth) {
        window.adminCalendar.nextMonth();
    } else {
        // Fallback
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    }
}

// Modal functions
function openModal(id) { 
    console.log('openModal called with id:', id);
    const element = document.getElementById(id);
    console.log('Element found:', !!element);
    if (element) {
        // Reset any inline styles that might be hiding the modal
        element.style.display = '';
        element.style.visibility = '';
        element.style.opacity = '';
        element.style.zIndex = '';
        
        element.classList.add('show');
        document.body.classList.add('modal-open');
        console.log('Added show class to element and reset inline styles');
        console.log('Element classes after:', element.className);
    } else {
        console.error('Element not found for id:', id);
    }
}
function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('show');
        
        // Force the modal to be hidden with inline styles to override any !important rules
        modal.style.display = 'none';
        modal.style.visibility = 'hidden';
        modal.style.opacity = '0';
        modal.style.zIndex = '-1';
        
        document.body.classList.remove('modal-open');
        console.log('Modal closed:', id);
    }
}
function closeBookingModal() { closeModal('bookingDetailsModal'); }
function closeBlockingModal() { closeModal('dateBlockingModal'); }
function closeBookingDetailsPopup() { closeModal('bookingDetailsPopupModal'); }
function closeMoveBookingModal() { closeModal('moveBookingModal'); }
function closeCustomerModal() { closeModal('customerModal'); }
function closeCustomerDetailsModal() { closeModal('customerDetailsModal'); }
function showImageModal(src) { document.getElementById('modalImage').src = src; openModal('imageModal'); }
function closeImageModal() { closeModal('imageModal'); }

// Dummy functions for buttons that might not have a corresponding function yet
function showQuoteModal(booking) { 
    console.log('showQuoteModal', booking);
    // Populate quote form with booking data
    if (booking) {
        document.getElementById('quoteClientName').value = booking.name || '';
        document.getElementById('quoteClientPhone').value = booking.phone || '';
        document.getElementById('quoteClientAddress').value = booking.address || '';
        document.getElementById('quoteClientEmail').value = booking.email || '';
        document.getElementById('quoteDate').value = new Date().toISOString().split('T')[0];
    }
    openModal('quoteModal');
}

function showInvoiceModalFromBooking(bookingId) {
    console.log('🚀 showInvoiceModalFromBooking called with bookingId:', bookingId);
    console.log('📊 allBookings available:', typeof allBookings, allBookings ? allBookings.length : 'undefined');
    console.log('🔍 Function called from:', new Error().stack);
    
    // Store the current booking ID for invoice creation
    window.currentInvoiceBookingId = bookingId;
    
    // Find the booking data
    const booking = allBookings ? allBookings.find(b => b.booking_id === bookingId) : null;
    console.log('Found booking:', booking);
    
    if (booking) {
        // Populate invoice form with booking data
        const nameField = document.getElementById('invoiceClientName');
        const phoneField = document.getElementById('invoiceClientPhone');
        const addressField = document.getElementById('invoiceClientAddress');
        const emailField = document.getElementById('invoiceClientEmail');
        const dateField = document.getElementById('invoiceDate');
        
        console.log('Form fields found:', {
            nameField: !!nameField,
            phoneField: !!phoneField,
            addressField: !!addressField,
            emailField: !!emailField,
            dateField: !!dateField
        });
        
        if (nameField) nameField.value = booking.name || '';
        if (phoneField) phoneField.value = booking.phone || '';
        if (addressField) addressField.value = booking.address || '';
        if (emailField) emailField.value = booking.email || '';
        if (dateField) dateField.value = new Date().toISOString().split('T')[0];
        
        // Check if there's a quote for this booking
        loadQuoteForInvoice(bookingId);
    } else {
        console.error('Booking not found for ID:', bookingId);
    }
    
    console.log('Attempting to open invoiceModal...');
    const modal = document.getElementById('invoiceModal');
    console.log('Modal element found:', !!modal);
    
    if (modal) {
        // Call the enhanced openModal function from admin.html
        if (typeof window.openModal === 'function') {
            window.openModal('invoiceModal');
            console.log('Modal opened successfully using window.openModal');
        } else {
            // Fallback to local openModal
            openModal('invoiceModal');
            console.log('Modal opened successfully using local openModal');
        }
    } else {
        console.error('Invoice modal element not found!');
    }
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

// Generate quote
async function generateQuote() {
    const clientName = document.getElementById('quoteClientName').value;
    const clientPhone = document.getElementById('quoteClientPhone').value;
    const clientAddress = document.getElementById('quoteClientAddress').value;
    const clientEmail = document.getElementById('quoteClientEmail').value;
    const quoteDate = document.getElementById('quoteDate').value;
    
    if (!clientName || !clientPhone || !clientAddress || !clientEmail || !quoteDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Get service items
    const serviceItems = [];
    const serviceItemElements = document.querySelectorAll('.service-item');
    
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
    const taxToggle = document.getElementById('taxToggle');
    const taxAmount = taxToggle && taxToggle.checked ? subtotal * 0.05 : 0;
    const grandTotal = subtotal + taxAmount;
    
    // Create quote data
    const quoteData = {
        client_name: clientName,
        client_phone: clientPhone,
        client_address: clientAddress,
        client_email: clientEmail,
        quote_date: quoteDate,
        service_items: JSON.stringify(serviceItems),
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: grandTotal
    };
    
    try {
        const response = await fetch('/api/quotes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(quoteData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('Quote created successfully!', 'success');
            closeModal('quoteModal');
            
            // Show quote preview
            showQuotePreview(result.quote_id);
        } else {
            const error = await response.json();
            showNotification(error.error || 'Failed to create quote', 'error');
        }
    } catch (error) {
        console.error('Error creating quote:', error);
        showNotification('Network error creating quote', 'error');
    }
}

// Show quote preview
function showQuotePreview(quoteId) {
    // This would populate the quote preview modal
    // For now, just show a success message
    showNotification(`Quote ${quoteId} created successfully!`, 'success');
}

// Add service item to quote
function addServiceItem() {
    const container = document.querySelector('.service-items-container');
    const itemCount = container.children.length + 1;
    
    const itemElement = document.createElement('div');
    itemElement.className = 'service-item';
    itemElement.dataset.itemId = itemCount;
    
    itemElement.innerHTML = `
        <div class="item-row">
            <div class="item-description">
                <input type="text" class="item-desc-input" placeholder="Service or item description" value="">
            </div>
            <div class="item-controls">
                <div class="item-quantity">
                    <input type="number" class="item-qty-input" value="1" min="1" placeholder="Qty">
                </div>
                <div class="item-price">
                    <input type="number" class="item-price-input" value="" min="0" step="0.01" placeholder="Price">
                </div>
                <div class="item-total">
                    <span class="item-total-amount">$0.00</span>
                </div>
                <div class="item-actions">
                    <button type="button" class="remove-item-btn" onclick="removeServiceItem(this)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(itemElement);
    
    // Add event listeners for calculations
    const qtyInput = itemElement.querySelector('.item-qty-input');
    const priceInput = itemElement.querySelector('.item-price-input');
    
    qtyInput.addEventListener('input', updateQuoteTotals);
    priceInput.addEventListener('input', updateQuoteTotals);
}

// Remove service item from quote
function removeServiceItem(button) {
    button.closest('.service-item').remove();
    updateQuoteTotals();
}

// Update quote totals
function updateQuoteTotals() {
    const serviceItems = document.querySelectorAll('.service-item');
    let subtotal = 0;
    
    serviceItems.forEach(item => {
        const quantity = parseFloat(item.querySelector('.item-qty-input').value) || 0;
        const price = parseFloat(item.querySelector('.item-price-input').value) || 0;
        const total = quantity * price;
        
        item.querySelector('.item-total-amount').textContent = `$${total.toFixed(2)}`;
        subtotal += total;
    });
    
    const taxToggle = document.getElementById('taxToggle');
    const taxAmount = taxToggle && taxToggle.checked ? subtotal * 0.05 : 0;
    const grandTotal = subtotal + taxAmount;
    
    document.getElementById('subtotalAmount').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('taxAmount').textContent = `$${taxAmount.toFixed(2)}`;
    document.getElementById('grandTotalAmount').textContent = `$${grandTotal.toFixed(2)}`;
    
    // Show/hide tax row
    const taxRow = document.getElementById('taxRow');
    if (taxRow) {
        taxRow.style.display = taxToggle && taxToggle.checked ? 'flex' : 'none';
    }
}

// Toggle tax for quote
function toggleTax() {
    updateQuoteTotals();
}

// Check for duplicate service items
function checkForDuplicateServiceItems() {
    const serviceItems = document.querySelectorAll('.service-item');
    const descriptions = [];
    const duplicates = [];
    
    serviceItems.forEach((item, index) => {
        const description = item.querySelector('.item-desc-input').value.trim().toLowerCase();
        if (description) {
            if (descriptions.includes(description)) {
                duplicates.push(index + 1);
            } else {
                descriptions.push(description);
            }
        }
    });
    
    if (duplicates.length > 0) {
        showNotification(`Duplicate service items found at positions: ${duplicates.join(', ')}`, 'warning');
    } else {
        showNotification('No duplicate service items found', 'success');
    }
}

// Debug quote totals
function debugQuoteTotals() {
    const serviceItems = document.querySelectorAll('.service-item');
    let subtotal = 0;
    const debugInfo = [];
    
    serviceItems.forEach((item, index) => {
        const description = item.querySelector('.item-desc-input').value;
        const quantity = parseFloat(item.querySelector('.item-qty-input').value) || 0;
        const price = parseFloat(item.querySelector('.item-price-input').value) || 0;
        const total = quantity * price;
        
        debugInfo.push(`Item ${index + 1}: ${description} - Qty: ${quantity}, Price: $${price}, Total: $${total}`);
        subtotal += total;
    });
    
    const taxToggle = document.getElementById('taxToggle');
    const taxAmount = taxToggle && taxToggle.checked ? subtotal * 0.05 : 0;
    const grandTotal = subtotal + taxAmount;
    
    console.log('Debug Quote Totals:', {
        serviceItems: debugInfo,
        subtotal,
        taxAmount,
        grandTotal
    });
    
    showNotification(`Debug info logged to console. Subtotal: $${subtotal.toFixed(2)}, Tax: $${taxAmount.toFixed(2)}, Total: $${grandTotal.toFixed(2)}`, 'info');
}

// Debug quote vs invoice totals discrepancy
function debugQuoteInvoiceDiscrepancy() {
    const quoteItems = document.querySelectorAll('.service-item');
    const invoiceItems = document.querySelectorAll('#invoiceServiceItems .service-item');
    
    let quoteSubtotal = 0;
    let invoiceSubtotal = 0;
    
    quoteItems.forEach(item => {
        const quantity = parseFloat(item.querySelector('.item-qty-input').value) || 0;
        const price = parseFloat(item.querySelector('.item-price-input').value) || 0;
        quoteSubtotal += quantity * price;
    });
    
    invoiceItems.forEach(item => {
        const quantity = parseFloat(item.querySelector('.item-qty-input').value) || 0;
        const price = parseFloat(item.querySelector('.item-price-input').value) || 0;
        invoiceSubtotal += quantity * price;
    });
    
    const difference = Math.abs(quoteSubtotal - invoiceSubtotal);
    
    console.log('Quote vs Invoice Debug:', {
        quoteSubtotal: quoteSubtotal.toFixed(2),
        invoiceSubtotal: invoiceSubtotal.toFixed(2),
        difference: difference.toFixed(2)
    });
    
    if (difference > 0.01) {
        showNotification(`Discrepancy found: Quote: $${quoteSubtotal.toFixed(2)}, Invoice: $${invoiceSubtotal.toFixed(2)}, Difference: $${difference.toFixed(2)}`, 'warning');
    } else {
        showNotification('No discrepancy found between quote and invoice totals', 'success');
    }
}

// Print quote
function printQuote() {
    window.print();
}

// Download quote PDF
function downloadQuotePDF() {
    showNotification('PDF download functionality coming soon', 'info');
}

// Send quote email
function sendQuoteEmail(event) {
    event.preventDefault();
    showNotification('Quote email functionality coming soon', 'info');
}

// Print invoice
function printInvoice() {
    window.print();
}

// Download invoice PDF
function downloadInvoicePDF() {
    showNotification('PDF download functionality coming soon', 'info');
}

// Send invoice email
function sendInvoiceEmail(event) {
    event.preventDefault();
    showNotification('Invoice email functionality coming soon', 'info');
}

// Test invoice modal
function testInvoiceModal() {
    showNotification('Testing invoice modal...', 'info');
    // You can add test data population here
}

// Manual refresh bookings
function manualRefreshBookings() {
    showNotification('Refreshing bookings...', 'info');
    loadBookings();
}

// Filter by stat card
function filterByStatCard(filterType) {
    currentFilter = filterType;
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    
    // Find and activate the corresponding filter tab
    const filterTab = document.querySelector(`[data-filter="${filterType}"]`);
    if (filterTab) {
        filterTab.classList.add('active');
    }
    
    renderActiveBookings();
}

// Render active bookings based on current filter
function renderActiveBookings() {
    const container = document.getElementById('bookingsContainer');
    if (!container) return;
    
    let filteredBookings = allBookings;
    
    // Apply filter
    if (currentFilter !== 'all') {
        filteredBookings = allBookings.filter(booking => {
            switch (currentFilter) {
                case 'pending':
                    return booking.status === 'pending-site-visit';
                case 'quote-ready':
                    return booking.status === 'quote-ready';
                case 'confirmed':
                    return booking.status === 'confirmed';
                case 'invoice-ready':
                    return booking.status === 'invoice-ready';
                case 'invoice-sent':
                    return booking.status === 'invoice-sent';
                case 'completed':
                    return booking.status === 'completed';
                case 'cancelled':
                    return booking.status === 'cancelled';
                default:
                    return true;
            }
        });
    }
    
    // Render the filtered bookings
    renderBookings(filteredBookings);
}

// Render bookings in the container
function renderBookings(bookings) {
    const container = document.getElementById('bookingsContainer');
    if (!container) return;
    
    if (bookings.length === 0) {
        container.innerHTML = '<div class="no-bookings">No bookings found for the selected filter.</div>';
        return;
    }
    
    // Sort bookings by date (newest first)
    const sortedBookings = bookings.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        // Handle invalid dates by putting them at the end
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return dateB - dateA;
    });
    
    container.innerHTML = sortedBookings.map(booking => createBookingCard(booking)).join('');
}

// Create booking card HTML
function createBookingCard(booking) {
    // This function should create the HTML for each booking card
    // For now, return a simple placeholder
    return `<div class="booking-card">
        <div class="booking-header">
            <div class="booking-id">${booking.booking_id}</div>
            <span class="status-badge ${booking.status}">${booking.status}</span>
        </div>
        <div class="booking-essentials">
            <div class="essential-row">
                <i class="fas fa-user essential-icon"></i>
                <span class="essential-label">Customer:</span>
                <span class="essential-value">${booking.name}</span>
            </div>
            <div class="essential-row">
                <i class="fas fa-calendar essential-icon"></i>
                <span class="essential-label">Date:</span>
                <span class="essential-value">${formatBookingDate(booking.date)}</span>
            </div>
        </div>
    </div>`;
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

// Get current booking ID for invoice creation
function getCurrentBookingId() {
    return window.currentInvoiceBookingId;
}

// Send invoice from booking
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

// Customer management functions - REMOVED
function moveBooking() { console.log('moveBooking'); }
function changeMoveMonth(month) { console.log('changeMoveMonth', month); }
function renderMoveCalendar() { /* TODO: Implement move calendar rendering */ }
function toggleDateBlock() { console.log('toggleDateBlock'); }
function unblockDate() { console.log('unblockDate'); }
// showBookingDetailsPopup is defined in admin.html

// Test function to verify modal can be opened
function testInvoiceModal() {
    console.log('Testing invoice modal...');
    const modal = document.getElementById('invoiceModal');
    console.log('Modal element:', modal);
    if (modal) {
        console.log('Modal classes before:', modal.className);
        console.log('Modal style display before:', modal.style.display);
        console.log('Modal computed style before:', window.getComputedStyle(modal).display);
        console.log('Modal position:', window.getComputedStyle(modal).position);
        console.log('Modal z-index:', window.getComputedStyle(modal).zIndex);
        
        // Add show class directly
        modal.classList.add('show');
        console.log('Modal classes after direct add:', modal.className);
        console.log('Modal computed style after:', window.getComputedStyle(modal).display);
        
        // Check modal content
        const modalContent = modal.querySelector('.modal-content');
        console.log('Modal content element:', modalContent);
        if (modalContent) {
            console.log('Modal content classes:', modalContent.className);
            console.log('Modal content computed style:', window.getComputedStyle(modalContent).display);
        }
        
        // Also try the openModal function
        setTimeout(() => {
            openModal('invoiceModal');
            console.log('Modal classes after openModal:', modal.className);
        }, 1000);
    }
}

// Debug: Verify functions are available globally
console.log('Admin.js loaded. Available functions:', {
    sendInvoiceFromBooking: typeof sendInvoiceFromBooking,
    showInvoiceModalFromBooking: typeof showInvoiceModalFromBooking,
    generateInvoice: typeof generateInvoice,
    getCurrentBookingId: typeof getCurrentBookingId,
    testInvoiceModal: typeof testInvoiceModal
});

// Make test function globally available
window.testInvoiceModal = testInvoiceModal;

// Also make showInvoiceModalFromBooking globally available for testing
window.showInvoiceModalFromBooking = showInvoiceModalFromBooking;

// Test function to manually test invoice modal
function testInvoiceModalWithBooking() {
    console.log('🧪 Testing invoice modal with sample booking...');
    // Use a sample booking ID or find the first invoice-ready booking
    const invoiceReadyBookings = allBookings ? allBookings.filter(b => b.status === 'invoice-ready') : [];
    if (invoiceReadyBookings.length > 0) {
        const testBookingId = invoiceReadyBookings[0].booking_id;
        console.log('🧪 Using booking ID:', testBookingId);
        showInvoiceModalFromBooking(testBookingId);
    } else {
        console.log('🧪 No invoice-ready bookings found. Using sample ID...');
        showInvoiceModalFromBooking('ST-MF7OPX46-4L15V'); // Use the ID from your console log
    }
}

window.testInvoiceModalWithBooking = testInvoiceModalWithBooking;
