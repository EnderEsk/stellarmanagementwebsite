// Admin Archive Management System
// Handles archiving, displaying, and managing archived bookings

class AdminArchive {
    constructor() {
        this.archivedBookings = [];
        this.isLoaded = false;
        this.searchQuery = '';
        this.init();
    }

    init() {
        this.createArchiveTab();
        this.bindEvents();
    }

    createArchiveTab() {
        // Add archive tab to the Management Views category
        const managementViews = document.querySelector('.tab-category:last-child .tab-row');
        if (managementViews) {
            const archiveTab = document.createElement('div');
            archiveTab.className = 'filter-tab';
            archiveTab.setAttribute('data-filter', 'archive');
            archiveTab.innerHTML = `
                <i class="fas fa-archive"></i>
                Archive
            `;
            managementViews.appendChild(archiveTab);
        }

        // Create archive view container
        const archiveView = document.createElement('div');
        archiveView.className = 'archive-view';
        archiveView.id = 'archiveView';
        archiveView.style.display = 'none';
        archiveView.innerHTML = this.getArchiveViewHTML();
        
        // Insert after the calendar view
        const calendarView = document.getElementById('calendarView');
        if (calendarView && calendarView.parentNode) {
            calendarView.parentNode.insertBefore(archiveView, calendarView.nextSibling);
        }
    }

    getArchiveViewHTML() {
        return `
            <div class="archive-header">
                <div class="archive-controls">
                    <div class="search-container">
                        <i class="fas fa-search search-icon"></i>
                        <input type="text" id="archiveSearch" placeholder="Search archived bookings..." class="archive-search-input">
                        <button type="button" id="clearSearch" class="search-clear-btn" style="display: none;" onclick="adminArchive.clearSearch()">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="search-shortcut">⌘K</div>
                    </div>
                </div>
            </div>
            <div class="archive-list" id="archiveList">
                <div class="empty-state">
                    <i class="fas fa-archive"></i>
                    <p>No archived bookings yet</p>
                    <small>Archived bookings will appear here</small>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Bind filter tab click
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-filter="archive"]')) {
                this.showArchiveView();
            }
        });

        // Bind search input - use event delegation since elements are created dynamically
        document.addEventListener('input', (e) => {
            if (e.target.id === 'archiveSearch') {
                this.searchQuery = e.target.value;
                console.log('Search query updated:', this.searchQuery); // Debug log
                
                // Show/hide clear button
                const clearBtn = document.getElementById('clearSearch');
                if (clearBtn) {
                    clearBtn.style.display = this.searchQuery.trim() ? 'block' : 'none';
                }
                
                this.renderArchivedBookings(); // Re-render with filtered results
            }
        });



        // Add keyboard shortcut for search focus
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.getElementById('archiveSearch');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }

    showArchiveView() {
        // Hide other views completely and clear their content
        const activeBookingsGrid = document.getElementById('activeBookingsGrid');
        const calendarView = document.getElementById('calendarView');
        
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
        
        // Show archive view
        const archiveView = document.getElementById('archiveView');
        if (archiveView) {
            archiveView.style.display = 'block';
        }
        
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
        const archiveTab = document.querySelector('[data-filter="archive"]');
        if (archiveTab) {
            archiveTab.classList.add('active');
        }
        
        // Load archived bookings if not already loaded
        if (!this.isLoaded) {
            this.loadArchivedBookings();
        }
    }

    async loadArchivedBookings() {
        try {
            const response = await fetch('/api/bookings/archived', {
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                this.archivedBookings = await response.json();
                this.isLoaded = true;
                this.renderArchivedBookings();
            } else {
                console.error('Failed to load archived bookings');
                this.showArchiveError();
            }
        } catch (error) {
            console.error('Error loading archived bookings:', error);
            this.showArchiveError();
        }
    }

    renderArchivedBookings() {
        const archiveList = document.getElementById('archiveList');
        if (!archiveList) return;

        if (this.archivedBookings.length === 0) {
            archiveList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-archive"></i>
                    <p>No archived bookings found</p>
                    <small>Archived bookings will appear here</small>
                </div>
            `;
            return;
        }

        const filteredBookings = this.filterArchivedBookings();
        
        archiveList.innerHTML = filteredBookings.map(booking => this.createArchiveItemHTML(booking)).join('');
    }

    createArchiveItemHTML(booking) {
        const archivedDate = new Date(booking.archived_at || booking.updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <div class="archive-item" data-booking-id="${booking.booking_id}">
                <div class="archive-item-content" onclick="adminArchive.showArchiveItemDetails('${booking.booking_id}')">
                    <div class="archive-item-main">
                        <div class="archive-item-name">${booking.name}</div>
                        <div class="archive-item-email">${booking.email}</div>
                        <div class="archive-item-archived">
                            <i class="fas fa-archive"></i>
                            <span>${archivedDate}</span>
                        </div>
                    </div>
                    <div class="archive-item-actions" onclick="event.stopPropagation();">
                        <div class="archive-item-menu" onclick="adminArchive.showArchiveItemMenu('${booking.booking_id}', event)">
                            <i class="fas fa-ellipsis-v"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
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

    filterArchivedBookings() {
        let filtered = [...this.archivedBookings];

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





    showArchiveItemDetails(bookingId) {
        const booking = this.archivedBookings.find(b => b.booking_id === bookingId);
        if (!booking) return;

        // Create and show detailed view modal
        this.showArchiveDetailsModal(booking);
    }

    showArchiveDetailsModal(booking) {
        const modal = document.createElement('div');
        modal.className = 'modal archive-details-modal';
        modal.innerHTML = `
            <div class="modal-content archive-details-content">
                <div class="modal-header">
                    <h3>Archived Booking Details</h3>
                    <button class="modal-close" onclick="adminArchive.closeArchiveModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="archive-details-grid">
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
                                <span class="detail-label">Status:</span>
                                <span class="detail-value status-${booking.status}">${this.getStatusText(booking.status)}</span>
                            </div>
                        </div>
                        <div class="detail-section">
                            <h4>Archive Information</h4>
                            <div class="detail-row">
                                <span class="detail-label">Archived Date:</span>
                                <span class="detail-value">${new Date(booking.archived_at || booking.updated_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Archived By:</span>
                                <span class="detail-value">${booking.archived_by || 'System'}</span>
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
                    <button class="btn btn-secondary" onclick="adminArchive.unarchiveBooking('${booking.booking_id}')">
                        <i class="fas fa-undo"></i> Unarchive
                    </button>
                    <button class="btn btn-danger" onclick="adminArchive.deleteArchivedBooking('${booking.booking_id}')">
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
                this.closeArchiveModal();
            }
        });
        
        // Add escape key to close functionality
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeArchiveModal();
            }
        });
        
        setTimeout(() => modal.classList.add('show'), 10);
    }
    
    closeArchiveModal() {
        const modal = document.querySelector('.archive-details-modal');
        if (modal) {
            modal.remove();
            // Restore background scrolling
            document.body.style.overflow = '';
        }
    }
    
    clearSearch() {
        this.searchQuery = '';
        const searchInput = document.getElementById('archiveSearch');
        const clearBtn = document.getElementById('clearSearch');
        
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
        
        this.renderArchivedBookings();
    }

    showArchiveItemMenu(bookingId, event) {
        event.stopPropagation();
        
        // Remove existing menus
        document.querySelectorAll('.archive-item-menu-dropdown').forEach(menu => menu.remove());
        
        const menu = document.createElement('div');
        menu.className = 'archive-item-menu-dropdown';
        menu.innerHTML = `
            <div class="menu-item" onclick="adminArchive.showArchiveItemDetails('${bookingId}')">
                <i class="fas fa-eye"></i> View Details
            </div>
            <div class="menu-item" onclick="adminArchive.unarchiveBooking('${bookingId}')">
                <i class="fas fa-undo"></i> Unarchive
            </div>
            <div class="menu-item danger" onclick="adminArchive.deleteArchivedBooking('${bookingId}')">
                <i class="fas fa-trash"></i> Delete Permanently
            </div>
        `;
        
        const menuButton = event.target.closest('.archive-item-menu');
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

    async unarchiveBooking(bookingId) {

        try {
            const response = await fetch(`/api/bookings/${bookingId}/unarchive`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                // Get the unarchived booking data
                const unarchivedBooking = await response.json();
                
                // Remove from archived list
                this.archivedBookings = this.archivedBookings.filter(b => b.booking_id !== bookingId);
                
                // Add back to active bookings list
                if (window.allBookings) {
                    window.allBookings.unshift(unarchivedBooking);
                }
                
                // Update archive UI
                this.renderArchivedBookings();
                
                // Close modal if open
                const modal = document.querySelector('.archive-details-modal');
                if (modal) modal.remove();
                
                // Show success message
                this.showNotification('Booking unarchived successfully', 'success');
                
                // Update active bookings UI immediately
                if (typeof window.renderActiveBookings === 'function') {
                    window.renderActiveBookings();
                }
                
                // Update statistics
                if (typeof window.updateStatistics === 'function') {
                    window.updateStatistics();
                }
                
                // Auto-switch to the appropriate tab for the restored status
                if (typeof window.autoSwitchToNextTab === 'function') {
                    window.autoSwitchToNextTab(unarchivedBooking.status);
                }
                
                // Check if we need to switch to the appropriate filter tab
                if (typeof window.currentFilter !== 'undefined' && window.currentFilter !== 'archive') {
                    // Find the corresponding filter tab and trigger its click
                    const filterTab = document.querySelector(`.filter-tab[data-filter="${unarchivedBooking.status}"]`);
                    if (filterTab) {
                        // Remove active class from all tabs
                        document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
                        
                        // Add active class to the appropriate filter tab
                        filterTab.classList.add('active');
                        
                        // Update current filter
                        window.currentFilter = unarchivedBooking.status;
                        
                                        // Update section title
                        if (typeof window.updateSectionTitle === 'function') {
                            window.updateSectionTitle();
                        }
                        
                        // Update calendar view if it's currently visible
                        if (typeof window.adminCalendar !== 'undefined' && window.adminCalendar.renderCalendar) {
                            window.adminCalendar.renderCalendar(window.allBookings);
                        }
                    }
                }
            } else {
                throw new Error('Failed to unarchive booking');
            }
        } catch (error) {
            console.error('Error unarchiving booking:', error);
            this.showNotification('Failed to unarchive booking', 'error');
        }
    }

    async deleteArchivedBooking(bookingId) {
        if (!confirm('Are you sure you want to permanently delete this archived booking? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/bookings/${bookingId}/delete`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                // Remove from archived list
                this.archivedBookings = this.archivedBookings.filter(b => b.booking_id !== bookingId);
                
                // Update UI
                this.renderArchivedBookings();
                
                // Close modal if open
                const modal = document.querySelector('.archive-details-modal');
                if (modal) modal.remove();
                
                // Show success message
                this.showNotification('Archived booking deleted permanently', 'success');
            } else {
                throw new Error('Failed to delete archived booking');
            }
        } catch (error) {
            console.error('Error deleting archived booking:', error);
            this.showNotification('Failed to delete archived booking', 'error');
        }
    }

    async archiveBooking(bookingId) {
        if (!confirm('Are you sure you want to archive this booking? It will be moved to the archive.')) {
            return false;
        }
        
        try {
            const response = await fetch(`/api/bookings/${bookingId}/archive`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                // Add to archived list
                const archivedBooking = await response.json();
                this.archivedBookings.unshift(archivedBooking);
                
                // Remove from active bookings list immediately
                if (window.allBookings) {
                    window.allBookings = window.allBookings.filter(b => b.booking_id !== bookingId);
                }
                
                // Update UI if archive view is active
                if (document.getElementById('archiveView').style.display !== 'none') {
                    this.renderArchivedBookings();
                }
                
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
                    if (currentFilter !== 'all' && currentFilter !== 'all-bookings' && currentFilter !== 'archive') {
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
                
                this.showNotification('Booking archived successfully', 'success');
                
                return true;
            } else {
                throw new Error('Failed to archive booking');
            }
        } catch (error) {
            console.error('Error archiving booking:', error);
            this.showNotification('Failed to archive booking', 'error');
            return false;
        }
    }

    showArchiveError() {
        const archiveList = document.getElementById('archiveList');
        if (archiveList) {
            archiveList.innerHTML = `
                <div class="empty-state error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load archived bookings</p>
                    <button class="btn btn-primary" onclick="adminArchive.loadArchivedBookings()">
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

// Initialize archive system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminArchive = new AdminArchive();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminArchive;
}
