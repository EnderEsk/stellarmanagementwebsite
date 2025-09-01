/**
 * Admin Booking Creation System
 * Allows administrators to create bookings directly from the admin panel
 */

class AdminBookingCreation {
    constructor() {
        this.modal = null;
        this.form = null;
        this.currentServiceItems = [];
        this.isSubmitting = false;
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
        console.log('✅ Admin Booking Creation system initialized');
    }

    createModal() {
        // Create modal HTML
        const modalHTML = `
            <div id="adminBookingCreationModal" class="modal">
                <div class="modal-content quote-modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-calendar-plus"></i> Create New Booking</h3>
                        <button class="modal-close" onclick="window.adminBookingCreation.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="quote-form">
                            <!-- Customer Information Section -->
                            <div class="quote-section">
                                <h4><i class="fas fa-user"></i> Customer Information</h4>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <input type="text" id="adminBookingName" placeholder="Full Name *" required>
                                    </div>
                                    <div class="form-group">
                                        <input type="email" id="adminBookingEmail" placeholder="Email Address *" required>
                                    </div>
                                    <div class="form-group">
                                        <input type="tel" id="adminBookingPhone" placeholder="Phone Number">
                                    </div>
                                    <div class="form-group">
                                        <input type="text" id="adminBookingAddress" placeholder="Address">
                                    </div>
                                </div>
                            </div>

                            <!-- Service Information Section -->
                            <div class="quote-section">
                                <h4><i class="fas fa-tools"></i> Service Information</h4>
                                <div class="form-grid">
                                    <div class="form-group">
                                        <select id="adminBookingService" required>
                                            <option value="">Select Service Type *</option>
                                            <option value="Tree Removal">Tree Removal</option>
                                            <option value="Trimming & Pruning">Trimming & Pruning</option>
                                            <option value="Stump Grinding">Stump Grinding</option>
                                            <option value="Emergency Service">Emergency Service</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <input type="date" id="adminBookingDate" required>
                                    </div>
                                    <div class="form-group">
                                        <select id="adminBookingTime" required>
                                            <option value="">Select Time *</option>
                                            <option value="5:30 PM">5:30 PM</option>
                                            <option value="6:30 PM">6:30 PM</option>
                                            <option value="7:30 PM">7:30 PM</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <textarea id="adminBookingNotes" rows="3" placeholder="Additional notes about the service..."></textarea>
                                </div>
                                <div class="admin-info-note">
                                    <i class="fas fa-info-circle"></i>
                                    <span>Admin Note: Weekend bookings are allowed. Only explicitly blocked dates are restricted.</span>
                                </div>
                            </div>

                            <!-- Service Items Section -->
                            <div class="quote-section">
                                <h4><i class="fas fa-list"></i> Service Items</h4>
                                <div class="service-items-container" id="adminServiceItemsContainer">
                                    <!-- Service items will be added here -->
                                </div>
                                <button type="button" class="add-item-btn" onclick="window.adminBookingCreation.addServiceItem()">
                                    <i class="fas fa-plus"></i> Add Service Item
                                </button>
                            </div>

                            <!-- Tax and Total Section -->
                            <div class="quote-section">
                                <div class="tax-toggle-container">
                                    <label class="tax-toggle-label">
                                        <input type="checkbox" id="adminTaxToggle" onchange="window.adminBookingCreation.updateCosts()">
                                        <span class="tax-toggle-text">Apply 5.00% Sales Tax</span>
                                    </label>
                                </div>
                                <div class="quote-totals">
                                    <div class="total-row">
                                        <span>Subtotal:</span>
                                        <span id="adminSubtotalAmount">$0.00</span>
                                    </div>
                                    <div class="total-row tax-row" id="adminTaxRow" style="display: none;">
                                        <span>Tax (5.00%):</span>
                                        <span id="adminTaxAmount">$0.00</span>
                                    </div>
                                    <div class="total-row grand-total">
                                        <span>Total:</span>
                                        <span id="adminGrandTotalAmount">$0.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="window.adminBookingCreation.closeModal()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="button" class="btn-primary" onclick="window.adminBookingCreation.submitBooking()" id="adminSubmitBookingBtn">
                            <i class="fas fa-calendar-plus"></i> Create Booking
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('adminBookingCreationModal');
        this.form = document.getElementById('adminBookingForm');
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('adminBookingDate').value = today;
        
        // Add initial service item
        this.addServiceItem();
    }

    bindEvents() {
        // Bind input events for cost calculation
        document.addEventListener('input', (e) => {
            if (e.target.closest('#adminBookingCreationModal')) {
                this.updateCosts();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.closest('#adminBookingCreationModal')) {
                this.updateCosts();
            }
        });

        // Bind tax toggle event
        const taxToggle = document.getElementById('adminTaxToggle');
        if (taxToggle) {
            taxToggle.addEventListener('change', () => this.updateCosts());
        }
    }

    showModal() {
        if (this.modal) {
            this.modal.classList.add('show');
            document.body.classList.add('modal-open');
            
            // Focus on first required field
            const firstRequiredField = this.modal.querySelector('input[required], select[required]');
            if (firstRequiredField) {
                firstRequiredField.focus();
            }
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
            document.body.classList.remove('modal-open');
            this.resetForm();
        }
    }

    resetForm() {
        // Reset all input fields
        const inputs = document.querySelectorAll('#adminBookingCreationModal input, #adminBookingCreationModal select, #adminBookingCreationModal textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else if (input.type === 'date') {
                // Reset date to today
                const today = new Date().toISOString().split('T')[0];
                input.value = today;
            } else {
                input.value = '';
            }
        });
        
        // Clear service items
        this.currentServiceItems = [];
        this.renderServiceItems();
        
        // Reset costs
        this.updateCosts();
    }

    addServiceItem() {
        const serviceItem = {
            id: Date.now() + Math.random(),
            description: '',
            quantity: 1,
            unitPrice: 0
        };
        
        this.currentServiceItems.push(serviceItem);
        this.renderServiceItems();
    }

    removeServiceItem(id) {
        this.currentServiceItems = this.currentServiceItems.filter(item => item.id !== id);
        this.renderServiceItems();
        this.updateCosts();
    }

    renderServiceItems() {
        const container = document.getElementById('adminServiceItemsContainer');
        if (!container) return;

        container.innerHTML = this.currentServiceItems.map(item => `
            <div class="service-item" data-id="${item.id}">
                <div class="item-description">
                    <input type="text" class="item-desc-input" placeholder="Service or item description" 
                           value="${item.description}" 
                           onchange="window.adminBookingCreation.updateServiceItem(${item.id}, 'description', this.value)">
                </div>
                <div class="item-quantity-price">
                    <div class="quantity-section">
                        <label>Quantity</label>
                        <input type="number" class="item-qty-input" value="${item.quantity}" min="1" placeholder="1"
                               onchange="window.adminBookingCreation.updateServiceItem(${item.id}, 'quantity', this.value)">
                    </div>
                    <div class="price-section">
                        <label>Price</label>
                        <input type="number" class="item-price-input" value="${item.unitPrice}" min="0" step="0.01" placeholder="Price"
                               onchange="window.adminBookingCreation.updateServiceItem(${item.id}, 'unitPrice', this.value)">
                    </div>
                </div>
                <div class="item-actions-total">
                    <button type="button" class="remove-item-btn" onclick="window.adminBookingCreation.removeServiceItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                    <div class="item-total">
                        <span class="item-total-amount">$${(item.quantity * item.unitPrice).toFixed(2)}</span>
                    </div>
                </div>
                <div class="item-photos">
                    <label>Photos:</label>
                    <button type="button" class="add-photo-btn">
                        <i class="fas fa-camera"></i> Add Photo
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateServiceItem(id, field, value) {
        const item = this.currentServiceItems.find(item => item.id === id);
        if (item) {
            item[field] = field === 'quantity' ? parseInt(value) || 1 : 
                          field === 'unitPrice' ? parseFloat(value) || 0 : value;
            this.renderServiceItems();
            this.updateCosts();
        }
    }

    updateCosts() {
        const subtotal = this.currentServiceItems.reduce((sum, item) => {
            return sum + (item.quantity * item.unitPrice);
        }, 0);

        const taxToggle = document.getElementById('adminTaxToggle');
        const includeTax = taxToggle ? taxToggle.checked : false;
        const taxAmount = includeTax ? subtotal * 0.05 : 0;
        const grandTotal = subtotal + taxAmount;

        // Update display
        const subtotalElement = document.getElementById('adminSubtotalAmount');
        const taxElement = document.getElementById('adminTaxAmount');
        const totalElement = document.getElementById('adminGrandTotalAmount');
        const taxRow = document.getElementById('adminTaxRow');

        if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        if (taxElement) taxElement.textContent = `$${taxAmount.toFixed(2)}`;
        if (totalElement) totalElement.textContent = `$${grandTotal.toFixed(2)}`;
        
        // Show/hide tax row
        if (taxRow) {
            taxRow.style.display = includeTax ? 'flex' : 'none';
        }
    }

    validateForm() {
        const requiredFields = ['adminBookingName', 'adminBookingEmail', 'adminBookingService', 'adminBookingDate', 'adminBookingTime'];
        const errors = [];

        // Check required fields
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                errors.push(`${fieldId.replace('adminBooking', '').replace(/([A-Z])/g, ' $1').trim()} is required`);
            }
        });

        // Validate email format
        const emailField = document.getElementById('adminBookingEmail');
        if (emailField && emailField.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailField.value)) {
                errors.push('Please enter a valid email address');
            }
        }

        // Validate date (not in past)
        const dateField = document.getElementById('adminBookingDate');
        if (dateField && dateField.value) {
            const selectedDate = new Date(dateField.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                errors.push('Cannot select a date in the past');
            }
        }

        // Validate service items
        if (this.currentServiceItems.length === 0) {
            errors.push('At least one service item is required');
        } else {
            this.currentServiceItems.forEach((item, index) => {
                if (!item.description.trim()) {
                    errors.push(`Service item ${index + 1} requires a description`);
                }
                if (item.unitPrice <= 0) {
                    errors.push(`Service item ${index + 1} requires a valid unit price`);
                }
            });
        }

        return errors;
    }

    async submitBooking() {
        if (this.isSubmitting) return;

        const errors = this.validateForm();
        if (errors.length > 0) {
            this.showNotification(errors.join('\n'), 'error');
            return;
        }

        this.isSubmitting = true;
        const submitBtn = document.getElementById('adminSubmitBookingBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        submitBtn.disabled = true;

        try {
            // Generate unique booking ID
            const bookingId = this.generateBookingId();
            
            // Prepare booking data
            const bookingData = {
                booking_id: bookingId,
                name: document.getElementById('adminBookingName').value.trim(),
                email: document.getElementById('adminBookingEmail').value.trim(),
                phone: document.getElementById('adminBookingPhone').value.trim() || '',
                address: document.getElementById('adminBookingAddress').value.trim() || '',
                service: document.getElementById('adminBookingService').value,
                date: document.getElementById('adminBookingDate').value,
                time: document.getElementById('adminBookingTime').value,
                notes: document.getElementById('adminBookingNotes').value.trim() || '',
                service_items: this.currentServiceItems,
                estimated_cost: parseFloat(document.getElementById('adminGrandTotalAmount').textContent.replace('$', ''))
            };

            // Create booking via API
            const response = await fetch('/api/admin/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify(bookingData)
            });

                            if (response.ok) {
                    const result = await response.json();
                    this.showNotification('Booking created successfully!', 'success');
                    console.log('✅ Admin booking created:', result);
                    
                    // Close modal
                    this.closeModal();
                    
                    // Refresh bookings list if available
                    if (typeof loadBookings === 'function') {
                        loadBookings();
                    }
                    
                    // Show success message
                    setTimeout(() => {
                        this.showNotification(`Booking ${bookingId} has been created and is now in the "Quote Ready" stage.`, 'success');
                    }, 1000);
                    
                } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create booking');
            }

        } catch (error) {
            console.error('❌ Error creating admin booking:', error);
            this.showNotification(`Failed to create booking: ${error.message}`, 'error');
        } finally {
            this.isSubmitting = false;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    generateBookingId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `ST-${timestamp}-${random}`.toUpperCase();
    }

    getAuthHeaders() {
        if (window.simpleGoogleAuth && window.simpleGoogleAuth.isUserAuthenticated()) {
            return window.simpleGoogleAuth.getAuthHeaders();
        }
        return {};
    }

    showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            // Fallback notification
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
            }, 5000);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.adminBookingCreation = new AdminBookingCreation();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminBookingCreation;
}
