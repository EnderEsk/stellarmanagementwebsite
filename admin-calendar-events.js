/**
 * Admin Calendar Events System
 * Allows administrators to create and manage calendar events (non-booking events)
 * such as mechanical work, maintenance, personal tasks, etc.
 */

class AdminCalendarEvents {
    constructor() {
        this.modal = null;
        this.form = null;
        this.currentEvent = null;
        this.isSubmitting = false;
        this.events = [];
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
        // Don't load events immediately - wait for authentication
        // this.loadEvents();
    }

    createModal() {
        // Create modal HTML
        const modalHTML = `
            <div id="adminCalendarEventsModal" class="modal">
                <div class="modal-content event-modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-calendar-plus"></i> Add Calendar Event</h3>
                        <button class="modal-close" onclick="window.adminCalendarEvents.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form class="event-form">
                            <!-- Row 1: Event Title -->
                            <div class="form-row">
                                <div class="form-group full-width">
                                    <div class="input-wrapper">
                                        <i class="fas fa-heading input-icon"></i>
                                        <input type="text" id="eventTitle" required>
                                        <label for="eventTitle" class="floating-label">Event Title</label>
                                    </div>
                                </div>
                            </div>

                            <!-- Row 2: Date and Type -->
                            <div class="form-row">
                                <div class="form-group half-width">
                                    <div class="input-wrapper">
                                        <i class="fas fa-calendar input-icon"></i>
                                        <input type="date" id="eventDate" required>
                                        <label for="eventDate" class="floating-label"></label>
                                    </div>
                                </div>
                                <div class="form-group half-width">
                                    <div class="input-wrapper">
                                        <i class="fas fa-tag input-icon"></i>
                                        <select id="eventType" required>
                                            <option value=""></option>
                                            <option value="mechanical">Mechanical Work</option>
                                            <option value="quote">Quote</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="personal">Personal Task</option>
                                            <option value="meeting">Meeting</option>
                                            <option value="training">Training</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <label for="eventType" class="floating-label">Event Type</label>
                                    </div>
                                </div>
                            </div>

                            <!-- Row 3: Start and End Time -->
                            <div class="form-row">
                                <div class="form-group half-width">
                                    <label for="eventStartTime">Start Time *</label>
                                    <div class="input-wrapper">
                                        <i class="fas fa-clock input-icon"></i>
                                        <input type="time" id="eventStartTime" required>
                                    </div>
                                </div>
                                <div class="form-group half-width">
                                    <label for="eventEndTime">End Time *</label>
                                    <div class="input-wrapper">
                                        <i class="fas fa-clock input-icon"></i>
                                        <input type="time" id="eventEndTime" required>
                                    </div>
                                </div>
                            </div>



                            <!-- Row 4: Location -->
                            <div class="form-row">
                                <div class="form-group full-width">
                                    <div class="input-wrapper">
                                        <i class="fas fa-map-marker-alt input-icon"></i>
                                        <input type="text" id="eventLocation" placeholder=" ">
                                        <label for="eventLocation" class="floating-label">Location</label>
                                    </div>
                                </div>
                            </div>

                            <!-- Row 5: Description -->
                            <div class="form-row">
                                <div class="form-group full-width">
                                    <div class="input-wrapper">
                                        <i class="fas fa-align-left input-icon"></i>
                                        <textarea id="eventDescription" rows="3" placeholder=" "></textarea>
                                        <label for="eventDescription" class="floating-label">Description</label>
                                    </div>
                                </div>
                            </div>

                            <!-- Row 6: Color Selection -->
                            <div class="form-row">
                                <div class="color-selection">
                                    <span class="color-label">Event Color:</span>
                                    <div class="color-swatches">
                                        <button type="button" class="color-swatch" data-color="#007bff" style="background-color: #007bff;" title="Blue"></button>
                                        <button type="button" class="color-swatch" data-color="#28a745" style="background-color: #28a745;" title="Green"></button>
                                        <button type="button" class="color-swatch" data-color="#ffc107" style="background-color: #ffc107;" title="Yellow"></button>
                                        <button type="button" class="color-swatch" data-color="#dc3545" style="background-color: #dc3545;" title="Red"></button>
                                        <button type="button" class="color-swatch" data-color="#6f42c1" style="background-color: #6f42c1;" title="Purple"></button>
                                        <button type="button" class="color-swatch" data-color="#fd7e14" style="background-color: #fd7e14;" title="Orange"></button>
                                    </div>
                                </div>
                            </div>

                            <!-- Row 7: Email Notification -->
                            <div class="form-row">
                                <div class="form-group full-width">
                                    <div class="email-notification-section">
                                        <div class="email-notification-content">
                                            <div class="email-icon">
                                                <i class="fas fa-envelope"></i>
                                            </div>
                                            <div class="email-text">
                                                <div class="email-label">Send confirmation email to myself</div>
                                                <div class="email-description">Get an email confirmation when this event is created or updated</div>
                                            </div>
                                            <div class="email-toggle">
                                                <input type="checkbox" id="sendToMyself" class="email-checkbox">
                                                <label for="sendToMyself" class="email-switch">
                                                    <span class="email-slider"></span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Row 8: Live Preview -->
                            <div class="form-row">
                                <div class="live-preview">
                                    <h4>Event Preview</h4>
                                    <div class="preview-card" id="eventPreviewCard">
                                        <div class="preview-header">
                                            <div class="preview-title" id="previewTitle">Event Title</div>
                                            <div class="preview-time" id="previewTime">Date & Time</div>
                                        </div>
                                        <div class="preview-details">
                                            <div class="preview-type" id="previewType">Event Type</div>
                                            <div class="preview-location" id="previewLocation">Location</div>
                                        </div>
                                        <div class="preview-description" id="previewDescription">Description will appear here...</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Row 9: Info Box -->
                            <div class="form-row">
                                <div class="info-box">
                                    <i class="fas fa-info-circle"></i>
                                    <span>This event will be displayed on all admin calendars and will not interfere with booking availability.</span>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="window.adminCalendarEvents.closeModal()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="button" class="btn-primary" onclick="window.adminCalendarEvents.saveEvent()">
                            <i class="fas fa-save"></i> Save Event
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('adminCalendarEventsModal');
    }

    bindFormEvents() {
        // Bind input events for live preview
        const inputs = ['eventTitle', 'eventDate', 'eventType', 'eventStartTime', 'eventEndTime', 'eventLocation', 'eventDescription'];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => this.updateLivePreview());
                input.addEventListener('focus', () => this.handleInputFocus(input));
                input.addEventListener('blur', () => this.handleInputBlur(input));
            }
        });

        // Initial preview update
        this.updateLivePreview();
    }



    bindColorSwatches() {
        const colorSwatches = document.querySelectorAll('.color-swatch');
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => this.handleColorSelection(swatch));
        });
    }





    handleColorSelection(swatch) {
        // Remove active class from all swatches
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked swatch
        swatch.classList.add('active');
        
        // Update selected color
        this.selectedColor = swatch.dataset.color;
        
        // Update preview card border color
        this.updatePreviewCardColor();
    }

    updateColorSelection() {
        const swatch = document.querySelector(`[data-color="${this.selectedColor}"]`);
        if (swatch) {
            swatch.classList.add('active');
        }
    }

    updatePreviewCardColor() {
        const previewCard = document.getElementById('eventPreviewCard');
        if (previewCard) {
            previewCard.style.borderLeftColor = this.selectedColor;
        }
    }

    handleInputFocus(input) {
        const wrapper = input.closest('.input-wrapper');
        if (wrapper) {
            wrapper.classList.add('focused');
        }
    }

    handleInputBlur(input) {
        const wrapper = input.closest('.input-wrapper');
        if (wrapper) {
            wrapper.classList.remove('focused');
            
            // Only apply floating label logic for inputs that have floating labels
            if (input.type !== 'time' && input.type !== 'date') {
                if (input.value.trim()) {
                    wrapper.classList.add('has-value');
                } else {
                    wrapper.classList.remove('has-value');
                }
            }
        }
    }

    updateLivePreview() {
        const title = document.getElementById('eventTitle').value || 'Event Title';
        const date = document.getElementById('eventDate').value || 'Date';
        const type = document.getElementById('eventType').value || 'Event Type';
        const startTime = document.getElementById('eventStartTime').value || '';
        const endTime = document.getElementById('eventEndTime').value || '';
        const location = document.getElementById('eventLocation').value || 'Location';
        const description = document.getElementById('eventDescription').value || 'Description will appear here...';

        // Update preview elements
        document.getElementById('previewTitle').textContent = title;
        document.getElementById('previewType').textContent = type;
        document.getElementById('previewLocation').textContent = location;
        document.getElementById('previewDescription').textContent = description;

        // Format date and time
        let timeDisplay = 'Date & Time';
        if (date && startTime && endTime) {
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            timeDisplay = `${formattedDate} • ${startTime} - ${endTime}`;
        }
        document.getElementById('previewTime').textContent = timeDisplay;

        // Update preview card color
        this.updatePreviewCardColor();
    }

    bindEvents() {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        const eventDateInput = document.getElementById('eventDate');
        if (eventDateInput) {
            eventDateInput.value = today;
        }

        // Set default start time to current time + 1 hour
        const now = new Date();
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        const startTimeInput = document.getElementById('eventStartTime');
        if (startTimeInput) {
            const timeString = nextHour.toTimeString().slice(0, 5); // Format: "HH:MM"
            startTimeInput.value = timeString;
        }

        // Set default end time to start time + 1 hour
        const endTimeInput = document.getElementById('eventEndTime');
        if (endTimeInput && startTimeInput) {
            const endTime = new Date(nextHour.getTime() + 60 * 60 * 1000);
            const endTimeString = endTime.toTimeString().slice(0, 5); // Format: "HH:MM"
            endTimeInput.value = endTimeString;
        }

        // Set default color
        this.selectedColor = '#007bff';
        this.updateColorSelection();

        // Bind form input events for live preview
        this.bindFormEvents();

        // Bind duration preset chips


        // Bind color swatches
        this.bindColorSwatches();
        
        // Bind email notification toggle
        this.bindEmailToggle();
    }
    
    bindEmailToggle() {
        const emailSwitch = document.querySelector('.email-switch');
        const emailCheckbox = document.getElementById('sendToMyself');
        
        if (emailSwitch && emailCheckbox) {
            emailSwitch.addEventListener('click', (e) => {
                e.preventDefault();
                emailCheckbox.checked = !emailCheckbox.checked;
                console.log('📧 Email toggle clicked, new state:', emailCheckbox.checked);
            });
        }
        console.log('📧 Email toggle binding completed');
    }

    showModal(selectedDate = null) {
        // Set default date to today if no specific date is provided
        const eventDateInput = document.getElementById('eventDate');
        if (eventDateInput) {
            if (selectedDate) {
                eventDateInput.value = selectedDate;
            } else {
                // Set to today's date
                const today = new Date().toISOString().split('T')[0];
                eventDateInput.value = today;
            }
        }

        // Set default times when opening modal
        const now = new Date();
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        const startTimeInput = document.getElementById('eventStartTime');
        const endTimeInput = document.getElementById('eventEndTime');
        
        if (startTimeInput) {
            const timeString = nextHour.toTimeString().slice(0, 5); // Format: "HH:MM"
            startTimeInput.value = timeString;
        }
        
        if (endTimeInput) {
            const endTime = new Date(nextHour.getTime() + 60 * 60 * 1000);
            const endTimeString = endTime.toTimeString().slice(0, 5); // Format: "HH:MM"
            endTimeInput.value = endTimeString;
        }
        
        this.modal.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = this.modal.querySelector('input, select');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    closeModal() {
        this.modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        this.resetForm();
    }

    resetForm() {
        const form = this.modal.querySelector('.event-form');
        if (form) {
            form.reset();
        }
        
        // Reset modal title and button text
        const modalTitle = document.querySelector('#adminCalendarEventsModal .modal-header h3');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-calendar-plus"></i> Add Calendar Event';
        }

        const saveButton = document.querySelector('#adminCalendarEventsModal .btn-primary');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-save"></i> Save Event';
        }
        
        // Reset to today's date
        const eventDateInput = document.getElementById('eventDate');
        if (eventDateInput) {
            eventDateInput.value = new Date().toISOString().split('T')[0];
        }

        // Reset time inputs
        const now = new Date();
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        const startTimeInput = document.getElementById('eventStartTime');
        const endTimeInput = document.getElementById('eventEndTime');
        
        if (startTimeInput) {
            const timeString = nextHour.toTimeString().slice(0, 5); // Format: "HH:MM"
            startTimeInput.value = timeString;
        }
        
        if (endTimeInput) {
            const endTime = new Date(nextHour.getTime() + 60 * 60 * 1000);
            const endTimeString = endTime.toTimeString().slice(0, 5); // Format: "HH:MM"
            endTimeInput.value = endTimeString;
        }

        // Reset color selection
        this.selectedColor = '#007bff';
        this.updateColorSelection();
        this.updatePreviewCardColor();

        // Reset toggle
        const sendToMyselfToggle = document.getElementById('sendToMyself');
        if (sendToMyselfToggle) {
            sendToMyselfToggle.checked = false;
        }

        // Reset input states (only for inputs with floating labels)
        document.querySelectorAll('.input-wrapper').forEach(wrapper => {
            wrapper.classList.remove('focused');
            // Only remove has-value for non-time/date inputs
            const input = wrapper.querySelector('input, select, textarea');
            if (input && input.type !== 'time' && input.type !== 'date') {
                wrapper.classList.remove('has-value');
            }
        });

        // Update live preview
        this.updateLivePreview();
        
        this.currentEvent = null;
    }

    async saveEvent() {
        if (this.isSubmitting) return;
        
        // Validate form
        const title = document.getElementById('eventTitle').value.trim();
        const type = document.getElementById('eventType').value;
        const date = document.getElementById('eventDate').value;
        const startTime = document.getElementById('eventStartTime').value;
        const endTime = document.getElementById('eventEndTime').value;
        const location = document.getElementById('eventLocation').value.trim();
        const description = document.getElementById('eventDescription').value.trim();
        const color = this.selectedColor;
        const sendToMyselfElement = document.getElementById('sendToMyself');
        const sendToMyself = sendToMyselfElement ? sendToMyselfElement.checked : false;
        
        console.log('📧 Debug - sendToMyself element:', sendToMyselfElement);
        console.log('📧 Debug - sendToMyself checked:', sendToMyself);
        console.log('📧 Debug - sendToMyself element exists:', !!sendToMyselfElement);

        if (!title || !type || !date || !startTime || !endTime) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        this.isSubmitting = true;
        
        try {
            const eventData = {
                title,
                type,
                date,
                startTime,
                endTime,
                location: location ? location.trim() : '',
                description,
                color,
                sendToMyself
            };
            
            console.log('📧 Debug - Event data being sent:', eventData);
            console.log('📧 Debug - sendToMyself in eventData:', eventData.sendToMyself);

            let response;
            let successMessage;

            if (this.currentEvent) {
                // Update existing event
                eventData.updated_at = new Date().toISOString();
                const eventId = this.currentEvent.id || this.currentEvent._id;
                
                response = await fetch(`/api/calendar-events/${eventId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.getAuthHeaders()
                    },
                    body: JSON.stringify(eventData)
                });
                successMessage = 'Event updated successfully!';
            } else {
                // Create new event
                eventData.created_at = new Date().toISOString();
                
                response = await fetch('/api/calendar-events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.getAuthHeaders()
                    },
                    body: JSON.stringify(eventData)
                });
                successMessage = 'Event created successfully!';
            }

            if (response.ok) {
                const result = await response.json();
                this.showNotification(successMessage, 'success');
                this.closeModal();
                
                // Refresh events data and calendar (same as manual refresh)
                await this.loadEvents();
                
                // Trigger the same refresh as manual refresh button
                if (typeof window.loadBookings === 'function') {
                    await window.loadBookings();
                }
            } else {
                const error = await response.json();
                this.showNotification(error.error || `Failed to ${this.currentEvent ? 'update' : 'create'} event`, 'error');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            this.showNotification('Network error saving event', 'error');
        } finally {
            this.isSubmitting = false;
        }
    }

    async loadEvents() {
        try {
            // Only load events if user is authenticated
            if (!window.simpleGoogleAuth || !window.simpleGoogleAuth.isUserAuthenticated()) {
                console.log('Calendar events: User not authenticated, skipping load');
                return;
            }

            const response = await fetch('/api/calendar-events', {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                this.events = await response.json();
                console.log('Calendar events loaded successfully:', this.events.length);
                console.log('All loaded events:', this.events);
                
                // Check specifically for September 1st event
                const sept1Events = this.events.filter(event => event.date === '2025-09-01');
                console.log('September 1st events in loaded data:', sept1Events);
            } else if (response.status === 401) {
                console.log('Calendar events: Authentication required, skipping load');
            } else {
                console.warn('Calendar events: Failed to load, status:', response.status);
            }
        } catch (error) {
            console.log('Calendar events: Error loading events:', error.message);
        }
    }

    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/calendar-events/${eventId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                this.showNotification('Event deleted successfully!', 'success');
                
                // Close any existing event details modal
                const existingModal = document.querySelector('.event-details-modal');
                if (existingModal) {
                    existingModal.remove();
                }
                
                // Refresh events data and calendar (same as manual refresh)
                await this.loadEvents();
                
                // Trigger the same refresh as manual refresh button
                if (typeof window.loadBookings === 'function') {
                    await window.loadBookings();
                }
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Failed to delete event', 'error');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            this.showNotification('Network error deleting event', 'error');
        }
    }

    getEventsForDate(dateString) {
        const dayEvents = this.events.filter(event => event.date === dateString);
        

        return dayEvents;
    }

    getAuthHeaders() {
        if (window.simpleGoogleAuth && window.simpleGoogleAuth.isUserAuthenticated()) {
            return window.simpleGoogleAuth.getAuthHeaders();
        }
        return {};
    }

    // Method to load events when authentication is confirmed
    async loadEventsWhenAuthenticated() {
        if (window.simpleGoogleAuth && window.simpleGoogleAuth.isUserAuthenticated()) {
            await this.loadEvents();
        }
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
            }, 3000);
        }
    }

    // Method to render event indicators on calendar days
    renderEventIndicators(dayElement, dateString) {
        // Skip rendering for mobile timeline view - events are handled directly in mobile calendar
        const isMobile = window.innerWidth <= 768;
        if (isMobile && dayElement.classList.contains('timeline-item')) {
            return;
        }
        
        const dayEvents = this.getEventsForDate(dateString);
        
        if (dayEvents.length > 0) {
            // Check if there's already a calendar items container
            let eventsContainer = dayElement.querySelector('.calendar-events-container');
            
            if (!eventsContainer) {
                // Create new events container if none exists
                eventsContainer = document.createElement('div');
                eventsContainer.className = 'calendar-events-container';
                eventsContainer.style.cssText = `
                    position: absolute;
                    top: 32px;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    padding: 4px;
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    pointer-events: none;
                    z-index: 15;
                `;
                dayElement.appendChild(eventsContainer);
            }

            // Add event cards
            dayEvents.forEach((event, index) => {
                if (index < 5) { // Limit to 5 events to avoid clutter
                    const eventCard = this.createEventCard(event);
                    eventsContainer.appendChild(eventCard);
                }
            });

            // Add more indicator if there are more events
            if (dayEvents.length > 5) {
                const moreIndicator = document.createElement('div');
                moreIndicator.className = 'more-events-indicator';
                moreIndicator.style.cssText = `
                    background: rgba(108, 117, 125, 0.9);
                    color: white;
                    font-size: 7px;
                    padding: 1px 4px;
                    border-radius: 4px;
                    text-align: center;
                    font-weight: 600;
                    backdrop-filter: blur(4px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                `;
                moreIndicator.textContent = `+${dayEvents.length - 5}`;
                moreIndicator.title = `${dayEvents.length - 5} more events`;
                eventsContainer.appendChild(moreIndicator);
            }

            dayElement.appendChild(eventsContainer);
        }
    }

    // Method to create individual event cards
    createEventCard(event) {
        const eventCard = document.createElement('div');
        eventCard.className = 'calendar-event-card';
        eventCard.dataset.eventId = event.id;
        eventCard.title = event.title;
        
        // Set the event color as CSS custom property and inline style for border
        const eventColor = event.color || '#007bff';
        eventCard.style.setProperty('--event-color', eventColor);
        eventCard.style.borderLeftColor = eventColor;
        
        // Set semi-transparent background based on event color
        const rgb = this.hexToRgb(eventColor);
        if (rgb) {
            eventCard.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`;
            
            // Add hover effect
            eventCard.addEventListener('mouseenter', () => {
                eventCard.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
            });
            
            eventCard.addEventListener('mouseleave', () => {
                eventCard.style.backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`;
            });
        }
        
        // Create event content with sleeker layout
        const eventContent = document.createElement('div');
        eventContent.className = 'event-content';
        
        // Event title with icon
        const eventTitle = document.createElement('div');
        eventTitle.className = 'event-title';
        eventTitle.innerHTML = `
            <i class="fas fa-calendar-day event-icon"></i>
            <span>${event.title}</span>
        `;
        
        // Assemble event card
        eventContent.appendChild(eventTitle);
        eventCard.appendChild(eventContent);
        

        
        // Add click handler for event details
        eventCard.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showEventDetails(event);
        });

        // Add tooltip for truncated titles
        if (event.title.length > 15) {
            eventCard.title = event.title;
        }
        
        return eventCard;
    }

    // Method to format event time
    formatEventTime(startTime, endTime) {
        if (!startTime || !endTime) return 'Time TBD';
        
        // Convert 24-hour format to 12-hour format
        const formatTime = (timeStr) => {
            const [hours, minutes] = timeStr.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${minutes} ${ampm}`;
        };
        
        return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }

    // Method to show event details
    showEventDetails(event) {
        // Create a simple modal to show event details
        const modal = document.createElement('div');
        modal.className = 'event-details-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.className = 'event-details-content';
        modalContent.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
            border-left: 4px solid ${event.color || '#007bff'};
        `;
        
        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="margin: 0; color: #2a2a2a;">${event.title}</h3>
                <button onclick="this.closest('.event-details-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
            </div>
            <div style="margin-bottom: 16px;">
                <p style="margin: 8px 0; color: #6b7280;">
                    <i class="fas fa-calendar" style="margin-right: 8px; color: ${event.color || '#007bff'};"></i>
                    ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p style="margin: 8px 0; color: #6b7280;">
                    <i class="fas fa-clock" style="margin-right: 8px; color: ${event.color || '#007bff'};"></i>
                    ${this.formatEventTime(event.startTime, event.endTime)}
                </p>
                ${event.location ? `<p style="margin: 8px 0; color: #6b7280;">
                    <i class="fas fa-map-marker-alt" style="margin-right: 8px; color: ${event.color || '#007bff'};"></i>
                    ${event.location}
                </p>` : ''}
                ${event.description ? `<p style="margin: 8px 0; color: #6b7280;">
                    <i class="fas fa-align-left" style="margin-right: 8px; color: ${event.color || '#007bff'};"></i>
                    ${event.description}
                </p>` : ''}
            </div>
            <div style="display: flex; gap: 8px;">
                <button onclick="window.adminCalendarEvents.editEvent('${event.id || event._id}')" style="flex: 1; padding: 12px; border: none; border-radius: 8px; background: ${event.color || '#007bff'}; color: white; cursor: pointer;">Edit</button>
                <button onclick="window.adminCalendarEvents.deleteEvent('${event.id || event._id}')" style="flex: 1; padding: 12px; border: none; border-radius: 8px; background: #dc3545; color: white; cursor: pointer;">Delete</button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Method to edit event
    async editEvent(eventId) {
        try {
            // Find the event to edit
            const event = this.events.find(e => (e.id || e._id) === eventId);
            if (!event) {
                this.showNotification('Event not found', 'error');
                return;
            }

            // Close any existing event details modal
            const existingModal = document.querySelector('.event-details-modal');
            if (existingModal) {
                existingModal.remove();
            }

            // Set current event for editing
            this.currentEvent = event;

            // Update modal title
            const modalTitle = document.querySelector('#adminCalendarEventsModal .modal-header h3');
            if (modalTitle) {
                modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Calendar Event';
            }

            // Update save button text
            const saveButton = document.querySelector('#adminCalendarEventsModal .btn-primary');
            if (saveButton) {
                saveButton.innerHTML = '<i class="fas fa-save"></i> Update Event';
            }

            // Pre-fill form with event data
            document.getElementById('eventTitle').value = event.title || '';
            document.getElementById('eventDate').value = event.date || '';
            document.getElementById('eventType').value = event.type || '';
            document.getElementById('eventStartTime').value = event.startTime || '';
            document.getElementById('eventEndTime').value = event.endTime || '';
            document.getElementById('eventLocation').value = event.location || '';
            document.getElementById('eventDescription').value = event.description || '';

            // Set color selection
            this.selectedColor = event.color || '#007bff';
            this.updateColorSelection();
            this.updatePreviewCardColor();

            // Update input states for floating labels
            document.querySelectorAll('.input-wrapper').forEach(wrapper => {
                const input = wrapper.querySelector('input, select, textarea');
                if (input && input.value && input.type !== 'time' && input.type !== 'date') {
                    wrapper.classList.add('has-value');
                }
            });

            // Update live preview
            this.updateLivePreview();

            // Show modal without resetting the date (pass the event's date)
            this.showModal(event.date);

        } catch (error) {
            console.error('Error editing event:', error);
            this.showNotification('Error loading event for editing', 'error');
        }
    }



    // Helper method to convert hex color to RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}

// Initialize the system when the page loads
document.addEventListener('DOMContentLoaded', function() {
    window.adminCalendarEvents = new AdminCalendarEvents();
});
