// Admin Trash Management System
// Handles trashing, displaying, and managing trashed bookings

class AdminTrash {
    constructor() {
        this.trashedBookings = [];
        this.isLoaded = false;
        this.searchQuery = '';
        this.cleanupPerformed = false;
        this.init();
    }

    init() {
        this.createTrashTab();
        this.bindEvents();
    }

    createTrashTab() {
        // Add trash tab to the Management Views category
        const managementViews = document.querySelector('.tab-category:last-child .tab-row');
        if (managementViews) {
            const trashTab = document.createElement('div');
            trashTab.className = 'filter-tab';
            trashTab.setAttribute('data-filter', 'trash');
            trashTab.innerHTML = `
                <i class="fas fa-trash-alt"></i>
                Trash
            `;
            managementViews.appendChild(trashTab);
        }

        // Create trash view container
        const trashView = document.createElement('div');
        trashView.className = 'trash-view';
        trashView.id = 'trashView';
        trashView.style.display = 'none';
        trashView.innerHTML = this.getTrashViewHTML();
        
        // Insert after the archive view
        const archiveView = document.getElementById('archiveView');
        if (archiveView && archiveView.parentNode) {
            archiveView.parentNode.insertBefore(trashView, archiveView.nextSibling);
        }
    }

    getTrashViewHTML() {
        return `
            <div class="trash-header">
                <div class="trash-controls">
                    <div class="search-container">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" id="trashSearch" placeholder="Search trashed bookings..." class="trash-search-input">
                        <button type="button" id="clearTrashSearch" class="search-clear-btn" style="display: none;" onclick="adminTrash.clearSearch()">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="search-shortcut">⌘K</div>
                    </div>
                </div>
            </div>
            <div class="trash-list" id="trashList">
                <div class="empty-state">
                    <i class="fas fa-trash-alt"></i>
                    <p>No trashed bookings yet</p>
                    <small>Deleted bookings will appear here</small>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Bind filter tab click
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-filter="trash"]')) {
                this.showTrashView();
            }
        });

        // Bind search input - use event delegation since elements are created dynamically
        document.addEventListener('input', (e) => {
            if (e.target.id === 'trashSearch') {
                this.searchQuery = e.target.value;
                console.log('Search query updated:', this.searchQuery); // Debug log
                
                // Show/hide clear button
                const clearBtn = document.getElementById('clearTrashSearch');
                if (clearBtn) {
                    clearBtn.style.display = this.searchQuery.trim() ? 'block' : 'none';
                }
                
                this.renderTrashedBookings(); // Re-render with filtered results
            }
        });

        // Add keyboard shortcut for search focus
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('trashSearch');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }

    showTrashView() {
        // Hide other views completely and clear their content
        const activeBookingsGrid = document.getElementById('activeBookingsGrid');
        const calendarView = document.getElementById('calendarView');
        const archiveView = document.getElementById('archiveView');
        
        if (activeBookingsGrid) {
            activeBookingsGrid.style.display = 'none';
            // Clear any content that might show "No bookings found"
            activeBookingsGrid.innerHTML = '';
            
            // Also hide any parent containers that might show empty states
            const emptyStates = activeBookingsGrid.querySelectorAll('.empty-state, .no-bookings');
            emptyStates.forEach(state => state.remove());
        }
        
        if (calendarView) {
            calendarView.style.display = 'none';
        }
        
        if (archiveView) {
            archiveView.style.display = 'none';
        }
        
        // Show trash view
        const trashView = document.getElementById('trashView');
        if (trashView) {
            trashView.style.display = 'block';
        }
        
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
        const trashTab = document.querySelector('[data-filter="trash"]');
        if (trashTab) {
            trashTab.classList.add('active');
        }
        
        // Load trashed bookings if not already loaded
        if (!this.isLoaded) {
            this.loadTrashedBookings();
        }
        
        // Perform cleanup on first load
        if (!this.cleanupPerformed) {
            this.cleanupExpiredTrash();
        }
    }

    async loadTrashedBookings() {
        try {
            const response = await fetch('/api/bookings/trashed', {
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                this.trashedBookings = await response.json();
                this.isLoaded = true;
                this.renderTrashedBookings();
                this.updateTrashCount();
            } else {
                console.error('Failed to load trashed bookings');
                this.showTrashError();
            }
        } catch (error) {
            console.error('Error loading trashed bookings:', error);
            this.showTrashError();
        }
    }

    async cleanupExpiredTrash() {
        try {
            const response = await fetch('/api/bookings/trash/cleanup', {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                const result = await response.json();
                this.cleanupPerformed = true;
                
                if (result.deletedCount > 0) {
                    console.log(`Cleaned up ${result.deletedCount} expired bookings`);
                    // Reload trashed bookings to reflect cleanup
                    this.loadTrashedBookings();
                }
            } else {
                console.error('Failed to cleanup expired trash');
            }
        } catch (error) {
            console.error('Error cleaning up expired trash:', error);
        }
    }

    renderTrashedBookings() {
        const trashList = document.getElementById('trashList');
        if (!trashList) return;

        if (this.trashedBookings.length === 0) {
            trashList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trash-alt"></i>
                    <p>No trashed bookings found</p>
                    <small>Deleted bookings will appear here</small>
                </div>
            `;
            return;
        }

        const filteredBookings = this.filterTrashedBookings();
        
        trashList.innerHTML = filteredBookings.map(booking => this.createTrashItemHTML(booking)).join('');
    }

    createTrashItemHTML(booking) {
        const trashedDate = new Date(booking.trashed_at || booking.updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const daysRemaining = this.calculateDaysRemaining(booking.trashed_at);
        const isExpiringSoon = daysRemaining <= 3;
        
        const daysRemainingText = daysRemaining > 0 ? 
            `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left` : 
            'Expired';

        return `
            <div class="trash-item ${isExpiringSoon ? 'expiring-soon' : ''}" data-booking-id="${booking.booking_id}">
                <div class="trash-item-content" onclick="adminTrash.showTrashItemDetails('${booking.booking_id}')">
                    <div class="trash-item-main">
                        <div class="trash-item-name">${booking.name}</div>
                        <div class="trash-item-email">${booking.email}</div>
                        <div class="trash-item-trashed">
                            <i class="fas fa-trash-alt"></i>
                            <span>${trashedDate}</span>
                        </div>
                        <div class="trash-item-days-remaining ${isExpiringSoon ? 'warning' : 'normal'}">
                            ${isExpiringSoon ? '⚠️ ' : ''}${daysRemainingText}
                        </div>
                    </div>
                    <div class="trash-item-actions" onclick="event.stopPropagation();">
                        <div class="trash-item-menu" onclick="adminTrash.showTrashItemMenu('${booking.booking_id}', event)">
                            <i class="fas fa-ellipsis-v"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    calculateDaysRemaining(trashedDate) {
        if (!trashedDate) return 0;
        
        const trashed = new Date(trashedDate);
        const now = new Date();
        const diffTime = now - trashed;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(0, 30 - diffDays);
    }

    getStatusText(status) {
        const statusMap = {
            'completed': 'Completed',
            'cancelled': 'Cancelled',
            'pending': 'Pending',
            'quote-ready': 'Quote Ready',
            'quote-sent': 'Quote Sent',
            'pending-booking': 'Job Scheduled',
            'invoice-ready': 'Invoice Ready',
            'invoice-sent': 'Invoice Sent'
        };
        return statusMap[status] || status;
    }

    filterTrashedBookings() {
        let filtered = [...this.trashedBookings];

        // Apply search filter only
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            console.log('Searching for:', query); // Debug log
            filtered = filtered.filter(booking => 
                booking.name.toLowerCase().includes(query) ||
                booking.email.toLowerCase().includes(query) ||
                booking.booking_id.toLowerCase().includes(query)
            );
            console.log('Filtered results:', filtered.length); // Debug log
        }

        return filtered;
    }

    showTrashItemDetails(bookingId) {
        const booking = this.trashedBookings.find(b => b.booking_id === bookingId);
        if (!booking) return;

        // Create and show detailed view modal
        this.showTrashDetailsModal(booking);
    }

    showTrashDetailsModal(booking) {
        const daysRemaining = this.calculateDaysRemaining(booking.trashed_at);
        const isExpiringSoon = daysRemaining <= 3;
        
        const modal = document.createElement('div');
        modal.className = 'modal trash-details-modal';
        modal.innerHTML = `
            <div class="modal-content trash-details-content">
                <div class="modal-header">
                    <h3>Trashed Booking Details</h3>
                    <button class="modal-close" onclick="adminTrash.closeTrashModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${isExpiringSoon ? `
                        <div class="alert alert-warning" style="background: rgba(220, 53, 69, 0.1); border: 1px solid #dc3545; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
                            <i class="fas fa-exclamation-triangle" style="color: #dc3545; margin-right: 0.5rem;"></i>
                            <strong>Warning:</strong> This booking will be permanently deleted in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.
                        </div>
                    ` : ''}
                    <div class="trash-details-grid">
                        <div class="detail-section">
                            <h4>Customer Information</h4>
                            <div class="detail-row">
                                <span class="detail-label">Name:</span>
                                <span class="detail-value">${booking.name}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Email:</span>
                                <span class="detail-value">${booking.email}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Phone:</span>
                                <span class="detail-value">${booking.phone || 'N/A'}</span>
                            </div>
                        </div>
                        <div class="detail-section">
                            <h4>Booking Information</h4>
                            <div class="detail-row">
                                <span class="detail-label">Booking ID:</span>
                                <span class="detail-value">${booking.booking_id}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Date:</span>
                                <span class="detail-value">${new Date(booking.date + 'T00:00:00').toLocaleDateString()}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Original Status:</span>
                                <span class="detail-value status-${booking.original_status || booking.status}">${this.getStatusText(booking.original_status || booking.status)}</span>
                            </div>
                        </div>
                        <div class="detail-section">
                            <h4>Trash Information</h4>
                            <div class="detail-row">
                                <span class="detail-label">Trashed Date:</span>
                                <span class="detail-value">${new Date(booking.trashed_at || booking.updated_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Trashed By:</span>
                                <span class="detail-value">${booking.trashed_by || 'System'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Days Remaining:</span>
                                <span class="detail-value ${isExpiringSoon ? 'warning' : 'normal'}">${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                    ${booking.notes ? `
                        <div class="detail-section">
                            <h4>Notes</h4>
                            <p class="detail-notes">${booking.notes}</p>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="adminTrash.restoreBooking('${booking.booking_id}')">
                        <i class="fas fa-undo"></i> Restore
                    </button>
                    <button class="btn btn-danger" onclick="adminTrash.deletePermanently('${booking.booking_id}')">
                        <i class="fas fa-trash"></i> Delete Permanently
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Prevent background scrolling
        document.body.style.overflow = 'hidden';
        
        // Add click outside to close functionality
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeTrashModal();
            }
        });
        
        // Add escape key to close functionality
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTrashModal();
            }
        });
        
        setTimeout(() => modal.classList.add('show'), 10);
    }
    
    closeTrashModal() {
        const modal = document.querySelector('.trash-details-modal');
        if (modal) {
            modal.remove();
            // Restore background scrolling
            document.body.style.overflow = '';
        }
    }
    
    clearSearch() {
        this.searchQuery = '';
        const searchInput = document.getElementById('trashSearch');
        const clearBtn = document.getElementById('clearTrashSearch');
        
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
        
        this.renderTrashedBookings();
    }

    showTrashItemMenu(bookingId, event) {
        event.stopPropagation();
        
        // Remove existing menus
        document.querySelectorAll('.trash-item-menu-dropdown').forEach(menu => menu.remove());
        
        const menu = document.createElement('div');
        menu.className = 'trash-item-menu-dropdown';
        menu.innerHTML = `
            <div class="menu-item" onclick="adminTrash.showTrashItemDetails('${bookingId}')">
                <i class="fas fa-eye"></i> View Details
            </div>
            <div class="menu-item" onclick="adminTrash.restoreBooking('${bookingId}')">
                <i class="fas fa-undo"></i> Restore
            </div>
            <div class="menu-item danger" onclick="adminTrash.deletePermanently('${bookingId}')">
                <i class="fas fa-trash"></i> Delete Permanently
            </div>
        `;
        
        const menuButton = event.target.closest('.trash-item-menu');
        if (!menuButton) return;
        
        // Position menu absolutely relative to the viewport
        menu.style.position = 'fixed';
        const rect = menuButton.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.left = `${rect.left}px`;
        menu.style.zIndex = '10000';
        
        // Add to body instead of menu button for proper positioning
        document.body.appendChild(menu);
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 0);
    }

    async restoreBooking(bookingId) {
        if (!confirm('Are you sure you want to restore this booking? It will be moved back to its original status.')) {
            return;
        }

        try {
            const response = await fetch(`/api/bookings/${bookingId}/restore`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                // Get the restored booking data
                const restoredBooking = await response.json();
                
                // Remove from trashed list
                this.trashedBookings = this.trashedBookings.filter(b => b.booking_id !== bookingId);
                
                // Add back to active bookings list
                if (window.allBookings) {
                    window.allBookings.unshift(restoredBooking);
                }
                
                // Update trash UI
                this.renderTrashedBookings();
                this.updateTrashCount();
                
                // Close modal if open
                const modal = document.querySelector('.trash-details-modal');
                if (modal) modal.remove();
                
                // Show success message
                this.showNotification('Booking restored successfully', 'success');
                
                // Update active bookings UI immediately
                if (typeof window.renderActiveBookings === 'function') {
                    window.renderActiveBookings();
                }
                
                // Update statistics
                if (typeof window.updateStatistics === 'function') {
                    window.updateStatistics();
                }
                
                // Update calendar view if it's currently visible
                if (typeof window.adminCalendar !== 'undefined' && window.adminCalendar.renderCalendar) {
                    window.adminCalendar.renderCalendar(window.allBookings);
                }
            } else {
                throw new Error('Failed to restore booking');
            }
        } catch (error) {
            console.error('Error restoring booking:', error);
            this.showNotification('Failed to restore booking', 'error');
        }
    }

    async deletePermanently(bookingId) {
        if (!confirm('Are you sure you want to permanently delete this booking? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                // Remove from trashed list
                this.trashedBookings = this.trashedBookings.filter(b => b.booking_id !== bookingId);
                
                // Update UI
                this.renderTrashedBookings();
                this.updateTrashCount();
                
                // Close modal if open
                const modal = document.querySelector('.trash-details-modal');
                if (modal) modal.remove();
                
                // Show success message
                this.showNotification('Booking permanently deleted', 'success');
            } else {
                throw new Error('Failed to permanently delete booking');
            }
        } catch (error) {
            console.error('Error permanently deleting booking:', error);
            this.showNotification('Failed to permanently delete booking', 'error');
        }
    }

    async trashBooking(bookingId) {
        if (!confirm('Are you sure you want to move this booking to trash? It can be restored within 30 days.')) {
            return false;
        }
        
        try {
            const response = await fetch(`/api/bookings/${bookingId}/trash`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                // Add to trashed list
                const trashedBooking = await response.json();
                this.trashedBookings.unshift(trashedBooking);
                
                // Remove from active bookings list immediately
                if (window.allBookings) {
                    window.allBookings = window.allBookings.filter(b => b.booking_id !== bookingId);
                }
                
                // Update UI if trash view is active
                if (document.getElementById('trashView').style.display !== 'none') {
                    this.renderTrashedBookings();
                }
                
                // Update trash count
                this.updateTrashCount();
                
                // Update active bookings UI
                if (typeof window.renderActiveBookings === 'function') {
                    window.renderActiveBookings();
                }
                
                // Update statistics
                if (typeof window.updateStatistics === 'function') {
                    window.updateStatistics();
                }
                
                // Close modal popup if open
                const modal = document.querySelector('.modal.show');
                if (modal) {
                    modal.classList.remove('show');
                    document.body.classList.remove('modal-open');
                }
                
                // Close booking details popup if open
                const bookingModal = document.getElementById('bookingDetailsPopupModal');
                if (bookingModal && bookingModal.classList.contains('show')) {
                    this.closeBookingDetailsPopup();
                }
                
                // Check if we need to show "No bookings found" message
                if (typeof window.currentFilter !== 'undefined') {
                    const currentFilter = window.currentFilter;
                    if (currentFilter !== 'all' && currentFilter !== 'all-bookings' && currentFilter !== 'trash') {
                        // Check if there are any bookings left for the current filter
                        const remainingBookings = window.allBookings.filter(b => b.status === currentFilter);
                        if (remainingBookings.length === 0) {
                            // Update the grid to show "No bookings found"
                            const grid = document.getElementById('activeBookingsGrid');
                            if (grid) {
                                grid.innerHTML = '<div class="empty-state">No bookings found</div>';
                            }
                        }
                    }
                }
                
                // Update calendar view if it's currently visible
                if (typeof window.adminCalendar !== 'undefined' && window.adminCalendar.renderCalendar) {
                    window.adminCalendar.renderCalendar(window.allBookings);
                }
                
                this.showNotification('Booking moved to trash', 'success');
                
                return true;
            } else {
                throw new Error('Failed to move booking to trash');
            }
        } catch (error) {
            console.error('Error moving booking to trash:', error);
            this.showNotification('Failed to move booking to trash', 'error');
            return false;
        }
    }

    updateTrashCount() {
        const trashCount = this.trashedBookings.length;
        
        // Update mobile sidebar count
        const mobileTrashCount = document.getElementById('trashCount');
        if (mobileTrashCount) {
            mobileTrashCount.textContent = trashCount;
        }
        
        // Update desktop sidebar count
        const desktopTrashCount = document.getElementById('desktop-trashCount');
        if (desktopTrashCount) {
            desktopTrashCount.textContent = trashCount;
        }
    }

    showTrashError() {
        const trashList = document.getElementById('trashList');
        if (trashList) {
            trashList.innerHTML = `
                <div class="empty-state error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load trashed bookings</p>
                    <button class="btn btn-primary" onclick="adminTrash.loadTrashedBookings()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }

    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }

    getAuthHeaders() {
        // Use existing auth headers if available
        if (typeof window.getAuthHeaders === 'function') {
            return window.getAuthHeaders();
        }
        
        // Fallback to basic headers
        return {
            'Content-Type': 'application/json'
        };
    }

    closeBookingDetailsPopup() {
        const modal = document.getElementById('bookingDetailsPopupModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
        }
    }
}

// Initialize trash system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminTrash = new AdminTrash();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminTrash;
}
