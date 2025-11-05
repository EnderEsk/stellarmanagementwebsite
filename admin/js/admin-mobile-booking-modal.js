/**
 * Mobile Booking Details Bottom Sheet Modal
 * Handles the mobile-specific bottom sheet modal for booking details
 */

class MobileBookingModal {
    constructor() {
        this.isOpen = false;
        this.currentBooking = null;
        this.init();
    }

    init() {
        // Create the modal HTML structure
        this.createModalStructure();
        
        // Add event listeners
        this.addEventListeners();
        
        // Make functions globally available
        this.makeGloballyAvailable();
    }

    createModalStructure() {
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.id = 'mobileBookingSheet';
        modalContainer.className = 'mobile-booking-sheet';
        
        modalContainer.innerHTML = `
            <div class="mobile-booking-sheet-backdrop"></div>
            <div class="mobile-booking-sheet-content">
                <div class="mobile-booking-sheet-header">
                    <h3 class="mobile-booking-sheet-title">Booking Details</h3>
                    <button class="mobile-booking-sheet-close" onclick="mobileBookingModal.close()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="mobile-booking-sheet-body" id="mobileBookingSheetBody">
                    <!-- Content will be populated here -->
                </div>
            </div>
        `;
        
        // Append to body
        document.body.appendChild(modalContainer);
    }

    addEventListeners() {
        // Close on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('mobile-booking-sheet-backdrop')) {
                this.close();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Prevent body scroll when modal is open
        this.preventBodyScroll();
    }

    preventBodyScroll() {
        const modal = document.getElementById('mobileBookingSheet');
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const hasShowClass = modal.classList.contains('show');
                    if (hasShowClass) {
                        document.body.style.overflow = 'hidden';
                    } else {
                        document.body.style.overflow = '';
                    }
                }
            });
        });
        
        observer.observe(modal, { attributes: true });
    }

    show(bookingId) {
        // Only show on mobile screens
        if (window.innerWidth >= 768) {
            // Fall back to desktop modal
            if (typeof window.showDetailedBookingDetailsPopup === 'function') {
                window.showDetailedBookingDetailsPopup(bookingId);
            }
            return;
        }

        // Find the booking
        const booking = (window.allBookings || []).find(b => b.booking_id === bookingId);
        if (!booking) {
            console.error('Booking not found:', bookingId);
            return;
        }

        this.currentBooking = booking;
        this.populateContent(booking);
        this.openModal();
    }

    populateContent(booking) {
        const body = document.getElementById('mobileBookingSheetBody');
        
        // Format dates
        const dateTime = new Date(booking.date + 'T' + booking.time).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        const statusClass = `status-${booking.status}`;
        let statusText = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);

        // Generate quick actions (Forward/Revert) based on status
        const quickActions = this.generateQuickActions(booking);

        // Generate action buttons based on status
        const actionButtons = this.generateActionButtons(booking);

        // Generate images HTML
        const imagesHtml = this.generateImagesHtml(booking);

        body.innerHTML = `
            ${quickActions ? `
            <!-- Quick Actions Section -->
            <div class="mobile-booking-quick-actions">
                ${quickActions}
            </div>
            ` : ''}
            <!-- Booking Info Section -->
            <div class="mobile-booking-section">
                <h4 class="mobile-booking-section-title">
                    <i class="fas fa-info-circle"></i>
                    Booking Info
                    <span class="mobile-booking-status-badge ${statusClass}">${statusText}</span>
                </h4>
                <div class="mobile-booking-info-row">
                    <span class="mobile-booking-info-label">ID:</span>
                    <span class="mobile-booking-info-value">
                        <a href="booking-status.html?booking=${booking.booking_id}" target="_blank" class="mobile-booking-link">
                            <i class="fas fa-external-link-alt"></i>
                            ${booking.booking_id}
                        </a>
                    </span>
                </div>
                <div class="mobile-booking-info-row">
                    <span class="mobile-booking-info-label">Service:</span>
                    <span class="mobile-booking-info-value">${booking.service}</span>
                </div>
                <div class="mobile-booking-info-row">
                    <span class="mobile-booking-info-label">Date:</span>
                    <span class="mobile-booking-info-value">${(() => {
                        // Use the same date formatting function that works on booking cards
                        if (!booking.date || typeof booking.date !== 'string') {
                            return 'Invalid Date';
                        }
                        
                        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                        if (!dateRegex.test(booking.date)) {
                            return 'Invalid Date';
                        }
                        
                        const [year, month, day] = booking.date.split('-').map(Number);
                        
                        if (isNaN(year) || isNaN(month) || isNaN(day)) {
                            return 'Invalid Date';
                        }
                        
                        const date = new Date(year, month - 1, day);
                        
                        if (isNaN(date.getTime())) {
                            return 'Invalid Date';
                        }
                        
                        return date.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                        });
                    })()}</span>
                </div>
            </div>

            <!-- Customer Section -->
            <div class="mobile-booking-section">
                <h4 class="mobile-booking-section-title">
                    <i class="fas fa-user"></i>
                    Customer
                </h4>
                <div class="mobile-booking-info-row">
                    <span class="mobile-booking-info-label">Name:</span>
                    <span class="mobile-booking-info-value">${booking.name}</span>
                </div>
                <div class="mobile-booking-info-row">
                    <span class="mobile-booking-info-label">Email:</span>
                    <span class="mobile-booking-info-value">
                        <a href="javascript:void(0)" onclick="showCustomerMessageModal('${booking.booking_id}', '${booking.name}', '${booking.email}'); mobileBookingModal.close();" class="mobile-booking-link">
                            <i class="fas fa-envelope"></i>
                            ${booking.email}
                        </a>
                    </span>
                </div>
                <div class="mobile-booking-info-row">
                    <span class="mobile-booking-info-label">Phone:</span>
                    <span class="mobile-booking-info-value">${booking.phone || 'Not provided'}</span>
                </div>
                <div class="mobile-booking-info-row">
                    <span class="mobile-booking-info-label">Address:</span>
                    <span class="mobile-booking-info-value">
                        ${booking.address ? 
                            `<a href="https://maps.google.com/?q=${encodeURIComponent(booking.address)}" target="_blank" class="mobile-booking-link">
                                <i class="fas fa-map-marker-alt"></i>
                                ${booking.address}
                            </a>` 
                            : 'Not provided'
                        }
                    </span>
                </div>
                <div class="mobile-booking-info-row">
                    <span class="mobile-booking-info-label">Notes:</span>
                    <span class="mobile-booking-info-value">
                        <textarea class="mobile-booking-notes" placeholder="Add your personal notes here..." data-booking-id="${booking.booking_id}">${booking.notes || ''}</textarea>
                        <button class="mobile-booking-save-notes" onclick="mobileBookingModal.saveNotes('${booking.booking_id}')">
                            <i class="fas fa-save"></i>
                            Save Notes
                        </button>
                    </span>
                </div>
                ${imagesHtml}
            </div>

            <!-- Actions Section -->
            ${actionButtons ? `
            <div class="mobile-booking-actions">
                ${actionButtons}
            </div>
            ` : ''}
        `;

        // Update title with generic text
        document.querySelector('.mobile-booking-sheet-title').textContent = 'Booking Details';
    }

    generateQuickActions(booking) {
        let quickActions = '';
        
        // Check if Forward or Revert actions are available for this status
        const hasForward = this.hasForwardAction(booking.status);
        const hasRevert = this.hasRevertAction(booking.status);
        
        if (!hasForward && !hasRevert) {
            return ''; // No quick actions available
        }
        
        if (hasRevert) {
            const revertTarget = this.getRevertTarget(booking.status);
            const revertTitle = this.getRevertTitle(booking.status);
            quickActions += `
                <button class="mobile-booking-quick-action-btn warning" onclick="revertBookingStatus('${booking.booking_id}', '${revertTarget}'); mobileBookingModal.close();" title="${revertTitle}">
                    <i class="fas fa-arrow-left"></i> Revert
                </button>
            `;
        } else {
            quickActions += `<div></div>`; // Empty placeholder for grid
        }
        
        if (hasForward) {
            const forwardTarget = this.getForwardTarget(booking.status);
            const forwardTitle = this.getForwardTitle(booking.status);
            quickActions += `
                <button class="mobile-booking-quick-action-btn forward" onclick="moveToNextStage('${booking.booking_id}', '${forwardTarget}'); mobileBookingModal.close();" title="${forwardTitle}">
                    <i class="fas fa-arrow-right"></i> Forward
                </button>
            `;
        } else {
            quickActions += `<div></div>`; // Empty placeholder for grid
        }
        
        return quickActions;
    }

    hasForwardAction(status) {
        return ['quote-ready', 'quote-sent', 'quote-accepted', 'pending-booking', 'invoice-ready', 'invoice-sent'].includes(status);
    }

    hasRevertAction(status) {
        return ['completed', 'quote-ready', 'quote-sent', 'quote-accepted', 'pending-booking', 'invoice-ready', 'invoice-sent'].includes(status);
    }

    getForwardTarget(status) {
        const forwardMap = {
            'quote-ready': 'quote-sent',
            'quote-sent': 'quote-accepted',
            'quote-accepted': 'pending-booking',
            'pending-booking': 'invoice-ready',
            'invoice-ready': 'invoice-sent',
            'invoice-sent': 'completed'
        };
        return forwardMap[status] || '';
    }

    getRevertTarget(status) {
        const revertMap = {
            'completed': 'invoice-sent',
            'quote-ready': 'pending',
            'quote-sent': 'quote-ready',
            'quote-accepted': 'quote-sent',
            'pending-booking': 'quote-accepted',
            'invoice-ready': 'pending-booking',
            'invoice-sent': 'invoice-ready'
        };
        return revertMap[status] || '';
    }

    getForwardTitle(status) {
        const titleMap = {
            'quote-ready': 'Move to Quote Sent',
            'quote-sent': 'Move to Quote Accepted',
            'quote-accepted': 'Move to Job Scheduled',
            'pending-booking': 'Move to Invoice Ready',
            'invoice-ready': 'Move to Invoice Sent',
            'invoice-sent': 'Move to Completed'
        };
        return titleMap[status] || 'Forward';
    }

    getRevertTitle(status) {
        const titleMap = {
            'completed': 'Revert to Invoice Sent',
            'quote-ready': 'Revert to Pending',
            'quote-sent': 'Revert to Quote Ready',
            'quote-accepted': 'Revert to Quote Sent',
            'pending-booking': 'Revert to Quote Accepted',
            'invoice-ready': 'Revert to Job Scheduled',
            'invoice-sent': 'Revert to Invoice Ready'
        };
        return titleMap[status] || 'Revert';
    }

    generateActionButtons(booking) {
        let actionButtons = '';
        
        if (booking.status === 'pending') {
            actionButtons = `
                <button class="mobile-booking-action-btn quote" onclick="showQuoteModal(${JSON.stringify(booking).replace(/"/g, '&quot;')}); mobileBookingModal.close();">
                    <i class="fas fa-file-invoice-dollar"></i> Quote
                </button>
                <button class="mobile-booking-action-btn confirm" onclick="updateBookingStatus('${booking.booking_id}', 'pending-booking'); mobileBookingModal.close();">
                    <i class="fas fa-check"></i> Schedule Job
                </button>
                <button class="mobile-booking-action-btn cancel" onclick="updateBookingStatus('${booking.booking_id}', 'cancelled'); mobileBookingModal.close();">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="mobile-booking-action-btn move" onclick="window.adminCalendar.showMoveBookingModal('${booking.booking_id}', '${booking.date}'); mobileBookingModal.close();">
                    <i class="fas fa-arrows-alt"></i> Move
                </button>
                <button class="mobile-booking-action-btn archive" onclick="adminArchive.archiveBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-archive"></i> Archive
                </button>
                <button class="mobile-booking-action-btn delete" onclick="deleteBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        } else if (booking.status === 'completed') {
            actionButtons = `
                <button class="mobile-booking-action-btn archive" onclick="adminArchive.archiveBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-archive"></i> Archive
                </button>
                <button class="mobile-booking-action-btn delete" onclick="deleteBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        } else if (booking.status === 'cancelled') {
            actionButtons = `
                <button class="mobile-booking-action-btn reopen" onclick="updateBookingStatus('${booking.booking_id}', 'pending'); mobileBookingModal.close();">
                    <i class="fas fa-redo"></i> Reopen
                </button>
                <button class="mobile-booking-action-btn quote" onclick="showQuoteModal(${JSON.stringify(booking).replace(/"/g, '&quot;')}); mobileBookingModal.close();">
                    <i class="fas fa-file-invoice-dollar"></i> Quote
                </button>
                <button class="mobile-booking-action-btn confirm" onclick="updateBookingStatus('${booking.booking_id}', 'pending-booking'); mobileBookingModal.close();">
                    <i class="fas fa-check"></i> Schedule Job
                </button>
                <button class="mobile-booking-action-btn complete" onclick="updateBookingStatus('${booking.booking_id}', 'completed'); mobileBookingModal.close();">
                    <i class="fas fa-check-double"></i> Complete
                </button>
                <button class="mobile-booking-action-btn move" onclick="window.adminCalendar.showMoveBookingModal('${booking.booking_id}', '${booking.date}'); mobileBookingModal.close();">
                    <i class="fas fa-arrows-alt"></i> Move
                </button>
                <button class="mobile-booking-action-btn archive" onclick="adminArchive.archiveBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-archive"></i> Archive
                </button>
                <button class="mobile-booking-action-btn delete" onclick="deleteBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        } else if (booking.status === 'quote-ready') {
            actionButtons = `
                <button class="mobile-booking-action-btn quote" onclick="showQuoteModal(${JSON.stringify(booking).replace(/"/g, '&quot;')}); mobileBookingModal.close();">
                    <i class="fas fa-file-invoice-dollar"></i> Quote
                </button>
                <button class="mobile-booking-action-btn archive" onclick="adminArchive.archiveBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-archive"></i> Archive
                </button>
                <button class="mobile-booking-action-btn delete" onclick="deleteBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        } else if (booking.status === 'quote-sent') {
            actionButtons = `
                <button class="mobile-booking-action-btn quote" onclick="showQuoteModal(${JSON.stringify(booking).replace(/"/g, '&quot;')}); mobileBookingModal.close();">
                    <i class="fas fa-file-invoice-dollar"></i> Quote
                </button>
                <button class="mobile-booking-action-btn archive" onclick="adminArchive.archiveBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-archive"></i> Archive
                </button>
                <button class="mobile-booking-action-btn delete" onclick="deleteBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        } else if (booking.status === 'quote-accepted') {
            actionButtons = `
                <button class="mobile-booking-action-btn quote" onclick="showQuoteModal(${JSON.stringify(booking).replace(/"/g, '&quot;')}); mobileBookingModal.close();">
                    <i class="fas fa-file-invoice-dollar"></i> Quote
                </button>
                <button class="mobile-booking-action-btn archive" onclick="adminArchive.archiveBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-archive"></i> Archive
                </button>
                <button class="mobile-booking-action-btn delete" onclick="deleteBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        } else if (booking.status === 'pending-booking') {
            actionButtons = `
                <button class="mobile-booking-action-btn quote" onclick="showQuoteModal(${JSON.stringify(booking).replace(/"/g, '&quot;')}); mobileBookingModal.close();">
                    <i class="fas fa-file-invoice-dollar"></i> Quote
                </button>
                <button class="mobile-booking-action-btn archive" onclick="adminArchive.archiveBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-archive"></i> Archive
                </button>
                <button class="mobile-booking-action-btn delete" onclick="deleteBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        } else if (booking.status === 'invoice-ready') {
            actionButtons = `
                <button class="mobile-booking-action-btn invoice" onclick="showInvoiceModalFromBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-file-invoice"></i> Invoice
                </button>
                <button class="mobile-booking-action-btn quote" onclick="sendInvoiceFromBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-file-invoice-dollar"></i> Send Invoice
                </button>
                <button class="mobile-booking-action-btn archive" onclick="adminArchive.archiveBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-archive"></i> Archive
                </button>
                <button class="mobile-booking-action-btn delete" onclick="deleteBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        } else if (booking.status === 'invoice-sent') {
            actionButtons = `
                <button class="mobile-booking-action-btn invoice" onclick="showInvoiceModalFromBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-file-invoice"></i> View Invoice
                </button>
                <button class="mobile-booking-action-btn archive" onclick="adminArchive.archiveBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-archive"></i> Archive
                </button>
                <button class="mobile-booking-action-btn delete" onclick="deleteBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        } else {
            // Fallback for any other statuses
            actionButtons = `
                <button class="mobile-booking-action-btn archive" onclick="adminArchive.archiveBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-archive"></i> Archive
                </button>
                <button class="mobile-booking-action-btn delete" onclick="deleteBooking('${booking.booking_id}'); mobileBookingModal.close();">
                    <i class="fas fa-trash"></i> Delete
                </button>
            `;
        }

        return actionButtons;
    }

    generateImagesHtml(booking) {
        if (!booking.images) return '';

        try {
            const imageArray = JSON.parse(booking.images);
            if (Array.isArray(imageArray) && imageArray.length > 0) {
                const imagesHtml = imageArray.map(imagePath => {
                    const isOldPath = imagePath.includes('booking-') && imagePath.includes('.');
                    const isNewPath = imagePath.includes('/uploads/') && imagePath.split('/').pop().length === 24;
                    
                    if (isOldPath) {
                        return `
                            <div class="mobile-booking-image-placeholder">
                                <i class="fas fa-image"></i>
                                <span>Old Image</span>
                            </div>
                        `;
                    } else if (isNewPath) {
                        return `
                            <img src="${imagePath}" alt="Booking image" class="mobile-booking-image" 
                                 onclick="showImageModal('${imagePath}')"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                                 onload="this.nextElementSibling.style.display='none';">
                            <div class="mobile-booking-image-placeholder" style="display: none;">
                                <i class="fas fa-image"></i>
                                <span>Unavailable</span>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="mobile-booking-image-placeholder">
                                <i class="fas fa-image"></i>
                                <span>Unknown Format</span>
                            </div>
                        `;
                    }
                }).join('');

                return `
                    <div class="mobile-booking-info-row">
                        <span class="mobile-booking-info-label">Images:</span>
                        <span class="mobile-booking-info-value">
                            <div class="mobile-booking-images">
                                ${imagesHtml}
                            </div>
                        </span>
                    </div>
                `;
            }
        } catch (e) {
            console.error('Error parsing images for booking details:', booking.booking_id, e);
        }

        return '';
    }

    openModal() {
        const modal = document.getElementById('mobileBookingSheet');
        modal.classList.add('show');
        this.isOpen = true;
    }

    close() {
        const modal = document.getElementById('mobileBookingSheet');
        modal.classList.remove('show');
        this.isOpen = false;
        this.currentBooking = null;
    }

    async saveNotes(bookingId) {
        const notesTextarea = document.querySelector('.mobile-booking-notes[data-booking-id="' + bookingId + '"]');
        const notes = notesTextarea.value;

        try {
            const response = await fetch(`/api/bookings/${bookingId}/notes`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ notes })
            });

            if (response.ok) {
                showNotification('Notes saved successfully!', 'success');
            } else {
                showNotification('Failed to save notes', 'error');
            }
        } catch (error) {
            console.error('Error saving notes:', error);
            showNotification('Network error saving notes', 'error');
        }
    }

    makeGloballyAvailable() {
        // Make the modal globally accessible
        window.mobileBookingModal = this;
        
        // Override the existing showDetailedBookingDetailsPopup function to use mobile modal when appropriate
        const originalShowDetailedBookingDetailsPopup = window.showDetailedBookingDetailsPopup;
        window.showDetailedBookingDetailsPopup = (bookingId) => {
            if (window.innerWidth < 768) {
                this.show(bookingId);
            } else {
                originalShowDetailedBookingDetailsPopup(bookingId);
            }
        };
    }
}

// Initialize the mobile booking modal when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MobileBookingModal();
});
